"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Copy,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquare,
  Satellite,
  Scale,
  DollarSign,
  Globe2,
  Newspaper,
  Search,
  Check,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const starterQueries = [
  {
    category: "Regulatory",
    icon: Scale,
    query:
      "What are the latest FCC spectrum allocation decisions and pending applications that could impact satellite operators?",
  },
  {
    category: "Competitive",
    icon: Satellite,
    query:
      "Give me a competitive landscape snapshot of the LEO satellite broadband market. Who holds the largest market share, what are the key competitive dynamics, and what recent moves should I be watching?",
  },
  {
    category: "Financial",
    icon: DollarSign,
    query:
      "Summarize the most recent quarterly filings (10-Q/10-K) from major space and defense companies. Focus on the last quarter only.",
  },
  {
    category: "Orbital",
    icon: Globe2,
    query:
      "What new satellite deployments have been registered in the past 30 days? Include operator, orbit type, and mission purpose.",
  },
  {
    category: "News",
    icon: Newspaper,
    query:
      "What are the biggest space and defense stories from the past 7 days? Prioritize regulatory decisions, major contracts, and launch events.",
  },
  {
    category: "Deep Dive",
    icon: Search,
    query:
      "Analyze the competitive landscape for on-orbit satellite servicing. Who are the key players, what contracts have been awarded, and what regulatory frameworks are emerging?",
  },
];

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/* ─── Markdown components for assistant responses ─── */
const markdownComponents = {
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-lg font-semibold text-cyan-600 mt-4 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-base font-semibold text-cyan-600 mt-3 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-sm font-semibold text-cyan-600 mt-3 mb-1.5" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
    <p className="text-sm text-slate-700 leading-relaxed mb-3" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-slate-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-slate-700" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
    <li className="text-sm text-slate-700 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-slate-900" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }: React.ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-600 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <div className="relative group my-3">
          <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return (
      <code
        className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: React.ComponentPropsWithoutRef<"pre">) => (
    <div>{children}</div>
  ),
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm border border-slate-200 rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 border-b border-slate-200"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<"td">) => (
    <td className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-2 border-cyan-400 pl-3 my-3 text-sm text-slate-600 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

export default function AskRaptorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <span className="text-slate-400">Loading...</span>
        </div>
      }
    >
      <AskRaptorContent />
    </Suspense>
  );
}

function AskRaptorContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch real conversations from database
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/v1/conversations");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setConversations(json.data);
        }
      } catch {
        // No conversations available
      }
    }
    fetchConversations();
  }, []);

  // Auto-send if query parameter exists
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === "assistant") {
                    lastMsg.content += data.text;
                  }
                  return updated;
                });
              }
              if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
              }
            } catch {
              // Skip non-JSON
            }
          }
        }
      }

      // Refresh conversation list after message
      try {
        const res = await fetch("/api/v1/conversations");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setConversations(json.data);
          }
        }
      } catch {
        // Ignore
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === "assistant" && !lastMsg.content) {
          lastMsg.content =
            "I apologize, but I'm unable to process your request right now. Please ensure you're authenticated and try again.";
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${convId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setConversationId(convId);
        setMessages(
          json.data.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch {
      // Failed to load conversation
    }
  };

  const copyMessage = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    inputRef.current?.focus();
  };

  // Render citation badges like [1], [2]
  const renderContent = (content: string) => {
    // Replace citation patterns [1], [2] etc. with styled badges
    const processed = content.replace(
      /\[(\d+)\]/g,
      '<span class="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-cyan-700 bg-cyan-100 rounded-full align-super mx-0.5">$1</span>'
    );
    return processed;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] -m-4 md:-m-8">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="hidden md:flex w-72 border-r border-slate-200 bg-white flex-col">
          <div className="p-4 border-b border-slate-100">
            <Button
              onClick={startNewConversation}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 px-4">
                No conversations yet. Ask Raptor a question to get started.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors mb-1",
                    conversationId === conv.id && "bg-cyan-50 border border-cyan-200"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatRelativeTime(conv.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-light">
        {/* Toggle History Button */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showHistory ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Ask Raptor</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full px-8">
              <div className="font-display font-black text-4xl tracking-wider text-slate-200 mb-8 select-none">
                SIG<span className="text-brand-cyan/30">/</span>N
                <span className="text-brand-cyan/30">AI</span>C
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                What would you like to know?
              </h2>
              <p className="text-sm text-slate-400 mb-8">
                Ask about regulatory filings, competitive intelligence, orbital
                data, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl w-full">
                {starterQueries.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(starter.query)}
                    className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-cyan/30 hover:shadow-card transition-all group"
                  >
                    <starter.icon className="w-5 h-5 text-slate-400 group-hover:text-brand-cyan transition-colors mb-2" />
                    <p className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-1">
                      {starter.category}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {starter.query}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message List
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Satellite className="w-4 h-4 text-brand-cyan" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 max-w-[85%]",
                      msg.role === "user"
                        ? "bg-brand-cyan text-white"
                        : "bg-white border border-slate-200 shadow-card"
                    )}
                  >
                    {msg.role === "user" ? (
                      <div className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    ) : msg.content ? (
                      <div className="prose-raptor">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {renderContent(msg.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-slate-400 text-sm">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                        Raptor is thinking...
                      </span>
                    )}
                    {msg.role === "assistant" && msg.content && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => copyMessage(idx, msg.content)}
                          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                        >
                          {copied === idx ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Raptor anything about space & defense intelligence..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan"
                />
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                size="lg"
                className="rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {messages.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Follow up:
                </span>
                <button
                  onClick={() =>
                    handleSend("What are the strategic implications?")
                  }
                  className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-brand-cyan transition-colors"
                >
                  What are the strategic implications?
                </button>
                <button
                  onClick={() => handleSend("Show me the source documents")}
                  className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-brand-cyan transition-colors"
                >
                  Show me the source documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
