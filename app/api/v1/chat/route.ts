import { NextRequest } from "next/server";
import { apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { retrieveContext, buildSystemPrompt } from "@/lib/rag";
import type { RAGContext } from "@/lib/rag";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`chat:${user.id}`, 20)) {
    return apiError("Rate limit exceeded. Max 20 requests per minute.", 429);
  }

  try {
    const { message, conversationId } = await request.json();

    if (!message || typeof message !== "string") {
      return apiError("Message is required");
    }

    const supabase = createClient();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: message.slice(0, 100),
        })
        .select("id")
        .single();

      if (convError) return apiError("Failed to create conversation", 500);
      convId = conv.id;
    }

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Get conversation history for context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    // -----------------------------------------------------------------------
    // RAG: Embed the query and retrieve relevant documents
    // -----------------------------------------------------------------------
    let ragContext: RAGContext;
    try {
      ragContext = await retrieveContext(message, {
        limit: 15,
        threshold: 0.3,
      });
    } catch (ragError) {
      console.error("[Chat] RAG retrieval failed, proceeding without context:", ragError);
      ragContext = { documents: [], contextBlock: "", sources: [] };
    }

    // Build system prompt with RAG context (or no-data instruction)
    const systemPrompt = buildSystemPrompt(ragContext);

    // Build messages for Claude
    const messages = (history || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Stream response from Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      return apiError("Failed to get AI response", 500);
    }

    // Create a transform stream to process SSE and save the complete response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";

    // Capture sources to save with the assistant message
    const sourcesToSave = ragContext.sources.length > 0 ? ragContext.sources : null;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();

        try {
          // Send sources metadata as the first SSE event so the client
          // can render citation badges while the text streams in
          if (sourcesToSave) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ sources: sourcesToSave, conversationId: convId })}\n\n`
              )
            );
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.text
                  ) {
                    fullContent += parsed.delta.text;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ text: parsed.delta.text, conversationId: convId })}\n\n`
                      )
                    );
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          // Save assistant response with sources
          await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: fullContent,
            sources: sourcesToSave,
          });

          // Update conversation timestamp
          if (!conversationId) {
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", convId);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`)
          );
          controller.close();
        } catch {
          controller.error("Stream processing error");
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
