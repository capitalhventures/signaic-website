import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../../.env.local") });
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 20;
const DELAY_MS = 500;
// Limit rows per table to keep total embeddings manageable (~800 target)
const MAX_ROWS_PER_TABLE = 200;

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("  Embedding error:", error);
    return [];
  }
}

interface TableConfig {
  name: string;
  sourceType: string;
  titleFn: (row: Record<string, unknown>) => string;
  contentFn: (row: Record<string, unknown>) => string;
  urlFn: (row: Record<string, unknown>) => string | null;
  metadataFn: (row: Record<string, unknown>) => Record<string, unknown>;
}

const tables: TableConfig[] = [
  {
    name: "companies",
    sourceType: "company",
    titleFn: (r) => String(r.name || "Unknown Company"),
    contentFn: (r) =>
      `${r.name}: ${r.description || ""} ${(r.sector_tags as string[] || []).join(", ")} ${r.headquarters || ""}`,
    urlFn: (r) => {
      const name = r.name as string;
      return name
        ? `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(name)}&action=getcompany`
        : null;
    },
    metadataFn: (r) => ({
      company_id: r.id,
      ticker: r.ticker,
      type: r.type,
      headquarters: r.headquarters,
      sector_tags: r.sector_tags,
    }),
  },
  {
    name: "fcc_filings",
    sourceType: "fcc_filing",
    titleFn: (r) =>
      `FCC Filing ${r.file_number || ""}: ${r.applicant_name || ""}`,
    contentFn: (r) =>
      `FCC Filing ${r.file_number || ""}: ${r.applicant_name || ""} ${r.filing_type || ""} ${r.raw_text || ""} ${(r.frequency_bands as string[] || []).join(", ")}`.slice(0, 8000),
    urlFn: (r) => {
      const url = r.source_url as string;
      if (url) return url;
      const fileNum = r.file_number as string;
      return fileNum
        ? `https://apps.fcc.gov/oetcf/ibfs/query/detail.cfm?id=${encodeURIComponent(fileNum)}`
        : null;
    },
    metadataFn: (r) => ({
      file_number: r.file_number,
      applicant_name: r.applicant_name,
      filing_type: r.filing_type,
      filing_date: r.filing_date,
      status: r.status,
      company_id: r.company_id,
    }),
  },
  {
    name: "orbital_data",
    sourceType: "orbital",
    titleFn: (r) =>
      `${r.object_name || "Unknown Object"} (NORAD ${r.norad_cat_id || "?"})`,
    contentFn: (r) =>
      `${r.object_name || ""} NORAD ${r.norad_cat_id || ""} ${r.orbit_type || ""} orbit, inclination ${r.inclination || ""}°, period ${r.period || ""} min, ${r.country_code || ""}`,
    urlFn: () => "https://www.space-track.org/",
    metadataFn: (r) => ({
      norad_cat_id: r.norad_cat_id,
      object_type: r.object_type,
      orbit_type: r.orbit_type,
      country_code: r.country_code,
      launch_date: r.launch_date,
      company_id: r.company_id,
    }),
  },
  {
    name: "patents",
    sourceType: "patent",
    titleFn: (r) =>
      `Patent ${r.patent_number || ""}: ${(r.title as string || "").slice(0, 100)}`,
    contentFn: (r) =>
      `Patent ${r.patent_number || ""}: ${r.title || ""} ${r.abstract || ""} ${r.technology_area || ""}`.slice(0, 8000),
    urlFn: (r) => {
      const patNum = r.patent_number as string;
      if (patNum) {
        const digits = patNum.replace(/[^0-9A-Za-z]/g, "");
        return `https://patents.google.com/patent/US${digits}`;
      }
      return null;
    },
    metadataFn: (r) => ({
      patent_number: r.patent_number,
      filing_date: r.filing_date,
      grant_date: r.grant_date,
      technology_area: r.technology_area,
      company_id: r.company_id,
    }),
  },
  {
    name: "gov_contracts",
    sourceType: "contract",
    titleFn: (r) =>
      `${r.awarding_agency || "Gov"} Contract: ${(r.contract_title as string || "").slice(0, 100)}`,
    contentFn: (r) =>
      `Contract ${r.contract_number || ""}: ${r.contract_title || ""} ${r.description || ""} ${r.awarding_agency || ""} $${r.contract_value || 0}`.slice(0, 8000),
    urlFn: (r) => {
      const num = r.contract_number as string;
      return num
        ? `https://www.usaspending.gov/search/?hash=${encodeURIComponent(num)}`
        : "https://www.usaspending.gov/search/";
    },
    metadataFn: (r) => ({
      contract_number: r.contract_number,
      awarding_agency: r.awarding_agency,
      contract_value: r.contract_value,
      period_start: r.period_start,
      period_end: r.period_end,
      company_id: r.company_id,
    }),
  },
  {
    name: "sec_filings",
    sourceType: "sec",
    titleFn: (r) =>
      `SEC ${r.filing_type || "Filing"}: ${(r.description as string || "").slice(0, 100)}`,
    contentFn: (r) =>
      `SEC ${r.filing_type || ""} filed ${r.filed_date || ""}: ${r.description || ""} Accession ${r.accession_number || ""}`.slice(0, 8000),
    urlFn: (r) => {
      const docUrl = r.document_url as string;
      if (docUrl) return docUrl;
      const accession = r.accession_number as string;
      return accession
        ? `https://www.sec.gov/Archives/edgar/data/${accession.replace(/-/g, "/")}`
        : null;
    },
    metadataFn: (r) => ({
      filing_type: r.filing_type,
      filed_date: r.filed_date,
      accession_number: r.accession_number,
      company_id: r.company_id,
    }),
  },
  {
    name: "federal_register",
    sourceType: "regulatory",
    titleFn: (r) =>
      String(r.title || "Federal Register Document"),
    contentFn: (r) =>
      `${r.title || ""} — ${r.agency || ""} (${r.type || ""}): ${r.abstract || ""}`.slice(0, 8000),
    urlFn: (r) => (r.federal_register_url as string) || null,
    metadataFn: (r) => ({
      document_number: r.document_number,
      agency: r.agency,
      type: r.type,
      publication_date: r.publication_date,
    }),
  },
  {
    name: "entities",
    sourceType: "entity",
    titleFn: (r) => String(r.name || "Unknown Entity"),
    contentFn: (r) =>
      `${r.name || ""} (${r.type || ""}): ${r.description || ""} Sectors: ${(r.sectors as string[] || []).join(", ")}`,
    urlFn: () => null,
    metadataFn: (r) => ({
      entity_id: r.id,
      slug: r.slug,
      type: r.type,
      sectors: r.sectors,
    }),
  },
];

async function main() {
  console.log("=== Generating Embeddings for Centralized Table ===\n");

  // Clear existing embeddings to avoid duplicates on re-run
  const { error: clearError } = await supabase
    .from("embeddings")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

  if (clearError) {
    console.error("Warning: Could not clear embeddings table:", clearError.message);
  } else {
    console.log("Cleared existing embeddings table\n");
  }

  let totalGenerated = 0;

  for (const table of tables) {
    console.log(`\nProcessing ${table.name} → source_type: "${table.sourceType}"...`);

    const { data: rows, error } = await supabase
      .from(table.name)
      .select("*")
      .limit(MAX_ROWS_PER_TABLE);

    if (error) {
      console.log(`  ✗ Skipped ${table.name}: ${error.message}`);
      continue;
    }

    if (!rows || rows.length === 0) {
      console.log(`  ○ Skipped ${table.name}: no rows`);
      continue;
    }

    console.log(`  ${rows.length} rows to process`);
    let tableCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        const content = table.contentFn(row as Record<string, unknown>);
        if (!content.trim()) continue;

        const embedding = await generateEmbedding(content);
        if (embedding.length === 0) continue;

        const title = table.titleFn(row as Record<string, unknown>);
        const sourceUrl = table.urlFn(row as Record<string, unknown>);
        const metadata = table.metadataFn(row as Record<string, unknown>);

        const { error: insertError } = await supabase
          .from("embeddings")
          .insert({
            content,
            metadata,
            source_type: table.sourceType,
            source_url: sourceUrl,
            title,
            embedding: JSON.stringify(embedding),
            embedding_model: "text-embedding-3-small",
          });

        if (insertError) {
          console.error(`  Error inserting ${table.name} row:`, insertError.message);
        } else {
          tableCount++;
          totalGenerated++;
        }
      }

      console.log(
        `  [${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}] ${table.name}: ${tableCount} embedded`
      );

      if (i + BATCH_SIZE < rows.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    console.log(`  ✓ ${table.name}: ${tableCount} embeddings generated`);
  }

  console.log(`\n=== Total embeddings generated: ${totalGenerated} ===`);

  // Final count verification
  const { count } = await supabase
    .from("embeddings")
    .select("*", { count: "exact", head: true });
  console.log(`Embeddings table now has ${count} rows`);
}

main().catch(console.error);
