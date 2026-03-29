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

const BATCH_SIZE = 50;
const DELAY_MS = 1000;
// Cap very large tables to keep total run time ~20 min and target 3000+ embeddings
const TABLE_ROW_LIMITS: Record<string, number> = {
  news: 1000,              // 7K+ rows — most recent 1000
  gov_contracts: 1500,     // 2.8K rows — most valuable 1500
  orbital_data: 1000,      // 120K+ rows — representative sample
  conjunction_events: 500, // limit to avoid timeout
  ucs_satellites: 500,     // limit to avoid timeout
};

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

function str(val: unknown): string {
  return val ? String(val) : "";
}

function joinArr(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  return "";
}

function currency(val: unknown): string {
  const n = Number(val);
  if (!n) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

const tables: TableConfig[] = [
  // ── Entities (enriched in E-9) ──────────────────────────────────────────
  {
    name: "entities",
    sourceType: "entity",
    titleFn: (r) => str(r.name) || "Unknown Entity",
    contentFn: (r) => {
      const parts = [
        `${str(r.name)} is a ${str(r.type)} in the ${joinArr(r.sectors)} sector.`,
        str(r.description),
        r.key_programs ? `Key programs: ${joinArr(r.key_programs)}.` : "",
        r.headquarters ? `HQ: ${str(r.headquarters)}.` : "",
        r.website ? `Website: ${str(r.website)}.` : "",
        r.ticker_symbol ? `Ticker: ${str(r.ticker_symbol)}.` : "",
        r.founded_year ? `Founded: ${str(r.founded_year)}.` : "",
        r.annual_revenue_estimate ? `Revenue: ${str(r.annual_revenue_estimate)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.website) || null,
    metadataFn: (r) => ({
      entity_id: r.id,
      slug: r.slug,
      type: r.type,
      sectors: r.sectors,
      ticker_symbol: r.ticker_symbol,
      headquarters: r.headquarters,
    }),
  },

  // ── News ────────────────────────────────────────────────────────────────
  {
    name: "news",
    sourceType: "news",
    titleFn: (r) => str(r.title) || "News Article",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.summary || r.description),
        r.source ? `Source: ${str(r.source)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
        r.category ? `Category: ${str(r.category)}.` : "",
        r.author ? `By ${str(r.author)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      source: r.source,
      source_name: r.source_name,
      published_at: r.published_at,
      category: r.category,
      author: r.author,
    }),
  },

  // ── RSS Feeds (5 industry sources from E-7) ────────────────────────────
  {
    name: "rss_feeds",
    sourceType: "rss",
    titleFn: (r) => str(r.title) || "RSS Article",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.source ? `Source: ${str(r.source)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
        r.tags ? `Tags: ${joinArr(r.tags)}.` : "",
        r.author ? `By ${str(r.author)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      source: r.source,
      published_at: r.published_at,
      tags: r.tags,
      author: r.author,
    }),
  },

  // ── Government Contracts ────────────────────────────────────────────────
  {
    name: "gov_contracts",
    sourceType: "contract",
    titleFn: (r) =>
      `${str(r.awarding_agency) || "Gov"} Contract: ${str(r.contract_title).slice(0, 100)}`,
    contentFn: (r) => {
      const parts = [
        str(r.contract_title) + ".",
        r.description ? str(r.description) : "",
        r.contractor_name ? `Contractor: ${str(r.contractor_name)}.` : "",
        r.awarding_agency ? `Agency: ${str(r.awarding_agency)}.` : "",
        r.contract_value ? `Value: ${currency(r.contract_value)}.` : "",
        r.naics_code ? `NAICS: ${str(r.naics_code)}.` : "",
        r.status ? `Status: ${str(r.status)}.` : "",
        r.contract_number ? `Contract #: ${str(r.contract_number)}.` : "",
        r.period_start ? `Period: ${str(r.period_start)} to ${str(r.period_end)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => {
      const num = str(r.contract_number);
      return num
        ? `https://www.usaspending.gov/search/?hash=${encodeURIComponent(num)}`
        : "https://www.usaspending.gov/search/";
    },
    metadataFn: (r) => ({
      contract_number: r.contract_number,
      awarding_agency: r.awarding_agency,
      contract_value: r.contract_value,
      contractor_name: r.contractor_name,
      period_start: r.period_start,
      period_end: r.period_end,
      company_id: r.company_id,
    }),
  },

  // ── SEC Filings ─────────────────────────────────────────────────────────
  {
    name: "sec_filings",
    sourceType: "sec",
    titleFn: (r) =>
      `SEC ${str(r.filing_type || r.form_type)}: ${str(r.company_name || r.description).slice(0, 100)}`,
    contentFn: (r) => {
      const parts = [
        `${str(r.company_name)} filed ${str(r.filing_type || r.form_type)} on ${str(r.filed_date || r.filing_date)}.`,
        str(r.description),
        r.accession_number ? `Accession: ${str(r.accession_number)}.` : "",
        r.cik ? `CIK: ${str(r.cik)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => {
      if (r.document_url) return str(r.document_url);
      if (r.source_url) return str(r.source_url);
      const accession = str(r.accession_number);
      return accession
        ? `https://www.sec.gov/Archives/edgar/data/${accession.replace(/-/g, "/")}`
        : null;
    },
    metadataFn: (r) => ({
      filing_type: r.filing_type || r.form_type,
      filed_date: r.filed_date || r.filing_date,
      accession_number: r.accession_number,
      company_name: r.company_name,
      cik: r.cik,
      company_id: r.company_id,
      entity_id: r.entity_id,
    }),
  },

  // ── FCC Filings ─────────────────────────────────────────────────────────
  {
    name: "fcc_filings",
    sourceType: "fcc_filing",
    titleFn: (r) =>
      `FCC Filing ${str(r.file_number)}: ${str(r.applicant_name || r.title)}`,
    contentFn: (r) => {
      const parts = [
        `FCC ${str(r.filing_type)} filing by ${str(r.applicant_name || r.title)}.`,
        r.file_number ? `File #: ${str(r.file_number)}.` : "",
        str(r.description || r.raw_text),
        r.frequency_bands ? `Frequency bands: ${joinArr(r.frequency_bands)}.` : "",
        r.status ? `Status: ${str(r.status)}.` : "",
        r.filing_date ? `Filed: ${str(r.filing_date)}.` : "",
        r.bureau ? `Bureau: ${str(r.bureau)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => {
      if (r.source_url) return str(r.source_url);
      const fileNum = str(r.file_number);
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
      bureau: r.bureau,
      company_id: r.company_id,
      entity_id: r.entity_id,
    }),
  },

  // ── Patents ─────────────────────────────────────────────────────────────
  {
    name: "patents",
    sourceType: "patent",
    titleFn: (r) =>
      `Patent ${str(r.patent_number)}: ${str(r.title).slice(0, 100)}`,
    contentFn: (r) => {
      const parts = [
        `Patent ${str(r.patent_number)}: ${str(r.title)}.`,
        str(r.abstract),
        r.assignee ? `Assignee: ${str(r.assignee)}.` : "",
        r.technology_area ? `Technology: ${str(r.technology_area)}.` : "",
        r.filing_date ? `Filed: ${str(r.filing_date)}.` : "",
        r.grant_date ? `Granted: ${str(r.grant_date)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => {
      const patNum = str(r.patent_number);
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
      assignee: r.assignee,
      company_id: r.company_id,
      entity_id: r.entity_id,
    }),
  },

  // ── Orbital Data ────────────────────────────────────────────────────────
  {
    name: "orbital_data",
    sourceType: "orbital",
    titleFn: (r) =>
      `${str(r.object_name) || "Unknown Object"} (NORAD ${str(r.norad_cat_id) || "?"})`,
    contentFn: (r) => {
      const parts = [
        `${str(r.object_name)} satellite tracked by NORAD catalog ID ${str(r.norad_cat_id)}.`,
        r.orbit_type ? `Orbit: ${str(r.orbit_type)}.` : "",
        r.inclination ? `Inclination: ${str(r.inclination)}°.` : "",
        r.period ? `Period: ${str(r.period)} min.` : "",
        r.apoapsis ? `Apoapsis: ${str(r.apoapsis)} km.` : "",
        r.periapsis ? `Periapsis: ${str(r.periapsis)} km.` : "",
        r.country_code ? `Country: ${str(r.country_code)}.` : "",
        r.object_type ? `Type: ${str(r.object_type)}.` : "",
        r.launch_date ? `Launched: ${str(r.launch_date)}.` : "",
        r.current_status ? `Status: ${str(r.current_status)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) =>
      r.norad_cat_id
        ? `https://celestrak.org/NORAD/elements/gp.php?CATNR=${r.norad_cat_id}`
        : "https://celestrak.org",
    metadataFn: (r) => ({
      norad_cat_id: r.norad_cat_id,
      object_type: r.object_type,
      orbit_type: r.orbit_type,
      country_code: r.country_code,
      launch_date: r.launch_date,
      current_status: r.current_status,
      company_id: r.company_id,
    }),
  },

  // ── Federal Register ────────────────────────────────────────────────────
  {
    name: "federal_register",
    sourceType: "regulatory",
    titleFn: (r) => str(r.title) || "Federal Register Document",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        r.agency ? `Agency: ${str(r.agency)}.` : "",
        r.document_type || r.type ? `Type: ${str(r.document_type || r.type)}.` : "",
        str(r.abstract),
        r.document_number ? `Document #: ${str(r.document_number)}.` : "",
        r.publication_date ? `Published: ${str(r.publication_date)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.federal_register_url || r.source_url) || null,
    metadataFn: (r) => ({
      document_number: r.document_number,
      agency: r.agency,
      type: r.document_type || r.type,
      publication_date: r.publication_date,
    }),
  },

  // ── SAM.gov Opportunities ───────────────────────────────────────────────
  {
    name: "sam_opportunities",
    sourceType: "sam_opportunity",
    titleFn: (r) => str(r.title) || "SAM.gov Opportunity",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        r.agency ? `Agency: ${str(r.agency)}.` : "",
        str(r.description),
        r.estimated_value ? `Estimated value: ${currency(r.estimated_value)}.` : "",
        r.naics_code ? `NAICS: ${str(r.naics_code)}.` : "",
        r.psc_code ? `PSC: ${str(r.psc_code)}.` : "",
        r.set_aside_type ? `Set-aside: ${str(r.set_aside_type)}.` : "",
        r.opportunity_type ? `Type: ${str(r.opportunity_type)}.` : "",
        r.response_deadline ? `Deadline: ${str(r.response_deadline)}.` : "",
        r.place_of_performance ? `Location: ${str(r.place_of_performance)}.` : "",
        r.solicitation_number ? `Solicitation #: ${str(r.solicitation_number)}.` : "",
        r.posted_date ? `Posted: ${str(r.posted_date)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.sam_gov_url) || null,
    metadataFn: (r) => ({
      solicitation_number: r.solicitation_number,
      agency: r.agency,
      naics_code: r.naics_code,
      opportunity_type: r.opportunity_type,
      estimated_value: r.estimated_value,
      response_deadline: r.response_deadline,
      posted_date: r.posted_date,
    }),
  },

  // ── SBIR/STTR Awards ───────────────────────────────────────────────────
  {
    name: "sbir_awards",
    sourceType: "sbir",
    titleFn: (r) => str(r.title) || "SBIR Award",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        r.agency ? `Agency: ${str(r.agency)}.` : "",
        r.firm ? `Firm: ${str(r.firm)}.` : "",
        r.phase ? `Phase: ${str(r.phase)}.` : "",
        r.award_amount ? `Award: ${currency(r.award_amount)}.` : "",
        r.award_year ? `Year: ${str(r.award_year)}.` : "",
        str(r.abstract),
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.source_url) || null,
    metadataFn: (r) => ({
      agency: r.agency,
      firm: r.firm,
      phase: r.phase,
      award_amount: r.award_amount,
      award_year: r.award_year,
      entity_id: r.entity_id,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // E-SOURCES-1: Free API Data Sources (3 tables)
  // ═══════════════════════════════════════════════════════════════════════

  // ── Space Weather (NOAA DONKI) ─────────────────────────────────────────
  {
    name: "space_weather",
    sourceType: "space_weather",
    titleFn: (r) => `Space Weather: ${str(r.event_type)}`,
    contentFn: (r) => {
      const parts = [
        `Space weather event: ${str(r.event_type)}.`,
        str(r.message),
        r.severity ? `Severity: ${str(r.severity)}.` : "",
        r.issue_time ? `Issued: ${str(r.issue_time)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.source_url) || null,
    metadataFn: (r) => ({
      event_type: r.event_type,
      severity: r.severity,
      issue_time: r.issue_time,
    }),
  },

  // ── Conjunction Events (CelesTrak) ─────────────────────────────────────
  {
    name: "conjunction_events",
    sourceType: "conjunction",
    titleFn: (r) =>
      `Conjunction: ${str(r.object1_name)} / ${str(r.object2_name)}`,
    contentFn: (r) => {
      const parts = [
        `Close approach between ${str(r.object1_name)} and ${str(r.object2_name)}.`,
        r.min_range_km ? `Minimum range: ${str(r.min_range_km)} km.` : "",
        r.tca ? `Time of closest approach: ${str(r.tca)}.` : "",
        r.probability ? `Collision probability: ${str(r.probability)}.` : "",
        r.object1_norad_id ? `Object 1 NORAD ID: ${str(r.object1_norad_id)}.` : "",
        r.object2_norad_id ? `Object 2 NORAD ID: ${str(r.object2_norad_id)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: () => "https://celestrak.org/SOCRATES/",
    metadataFn: (r) => ({
      object1_name: r.object1_name,
      object1_norad_id: r.object1_norad_id,
      object2_name: r.object2_name,
      object2_norad_id: r.object2_norad_id,
      min_range_km: r.min_range_km,
      probability: r.probability,
      tca: r.tca,
    }),
  },

  // ── Launch Licenses (FAA) ──────────────────────────────────────────────
  {
    name: "launch_licenses",
    sourceType: "launch_license",
    titleFn: (r) =>
      `FAA Launch License: ${str(r.licensee)} - ${str(r.vehicle)}`,
    contentFn: (r) => {
      const parts = [
        `FAA launch license for ${str(r.licensee)}.`,
        r.vehicle ? `Vehicle: ${str(r.vehicle)}.` : "",
        r.license_number ? `License #: ${str(r.license_number)}.` : "",
        r.launch_site ? `Launch site: ${str(r.launch_site)}.` : "",
        r.status ? `Status: ${str(r.status)}.` : "",
        r.issue_date ? `Issued: ${str(r.issue_date)}.` : "",
        r.expiry_date ? `Expires: ${str(r.expiry_date)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: () => "https://www.faa.gov/space/licenses",
    metadataFn: (r) => ({
      licensee: r.licensee,
      license_number: r.license_number,
      vehicle: r.vehicle,
      launch_site: r.launch_site,
      status: r.status,
      issue_date: r.issue_date,
      expiry_date: r.expiry_date,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // E-SOURCES-2: 11 Additional Data Sources
  // ═══════════════════════════════════════════════════════════════════════

  // ── DARPA Opportunities ────────────────────────────────────────────────
  {
    name: "darpa_opportunities",
    sourceType: "darpa",
    titleFn: (r) => str(r.title) || "DARPA Opportunity",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        r.agency ? `Agency: ${str(r.agency)}.` : "",
        str(r.description),
        r.solicitation_number ? `Solicitation #: ${str(r.solicitation_number)}.` : "",
        r.estimated_value ? `Estimated value: ${currency(r.estimated_value)}.` : "",
        r.naics_code ? `NAICS: ${str(r.naics_code)}.` : "",
        r.psc_code ? `PSC: ${str(r.psc_code)}.` : "",
        r.opportunity_type ? `Type: ${str(r.opportunity_type)}.` : "",
        r.set_aside_type ? `Set-aside: ${str(r.set_aside_type)}.` : "",
        r.response_deadline ? `Deadline: ${str(r.response_deadline)}.` : "",
        r.place_of_performance ? `Location: ${str(r.place_of_performance)}.` : "",
        r.posted_date ? `Posted: ${str(r.posted_date)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.sam_gov_url) || null,
    metadataFn: (r) => ({
      solicitation_number: r.solicitation_number,
      agency: r.agency,
      naics_code: r.naics_code,
      opportunity_type: r.opportunity_type,
      estimated_value: r.estimated_value,
      response_deadline: r.response_deadline,
      posted_date: r.posted_date,
    }),
  },

  // ── UCS Satellites ─────────────────────────────────────────────────────
  {
    name: "ucs_satellites",
    sourceType: "ucs_satellite",
    titleFn: (r) => `${str(r.name)} (${str(r.operator) || str(r.country)})`,
    contentFn: (r) => {
      const parts = [
        `${str(r.name)} satellite operated by ${str(r.operator)} from ${str(r.country)}.`,
        r.purpose ? `Purpose: ${str(r.purpose)}.` : "",
        r.orbit_class ? `Orbit: ${str(r.orbit_class)}.` : "",
        r.orbit_type ? `Orbit type: ${str(r.orbit_type)}.` : "",
        r.contractor ? `Contractor: ${str(r.contractor)}.` : "",
        r.launch_date ? `Launched: ${str(r.launch_date)}.` : "",
        r.launch_site ? `Launch site: ${str(r.launch_site)}.` : "",
        r.launch_mass_kg ? `Launch mass: ${str(r.launch_mass_kg)} kg.` : "",
        r.perigee_km ? `Perigee: ${str(r.perigee_km)} km.` : "",
        r.apogee_km ? `Apogee: ${str(r.apogee_km)} km.` : "",
        r.period_minutes ? `Period: ${str(r.period_minutes)} min.` : "",
        r.norad_id ? `NORAD ID: ${str(r.norad_id)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) =>
      r.norad_id
        ? `https://celestrak.org/NORAD/elements/gp.php?CATNR=${r.norad_id}`
        : "https://www.ucsusa.org/resources/satellite-database",
    metadataFn: (r) => ({
      name: r.name,
      country: r.country,
      operator: r.operator,
      purpose: r.purpose,
      orbit_class: r.orbit_class,
      norad_id: r.norad_id,
      launch_date: r.launch_date,
    }),
  },

  // ── CSIS Reports ───────────────────────────────────────────────────────
  {
    name: "csis_reports",
    sourceType: "csis_report",
    titleFn: (r) => str(r.title) || "CSIS Report",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.author ? `Author: ${str(r.author)}.` : "",
        r.category ? `Category: ${str(r.category)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      author: r.author,
      category: r.category,
      published_at: r.published_at,
    }),
  },

  // ── DIU Projects ───────────────────────────────────────────────────────
  {
    name: "diu_projects",
    sourceType: "diu_project",
    titleFn: (r) => str(r.title) || "DIU Project",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.focus_area ? `Focus area: ${str(r.focus_area)}.` : "",
        r.status ? `Status: ${str(r.status)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      focus_area: r.focus_area,
      status: r.status,
      published_at: r.published_at,
    }),
  },

  // ── Bryce Tech Reports ─────────────────────────────────────────────────
  {
    name: "bryce_reports",
    sourceType: "bryce_report",
    titleFn: (r) => str(r.title) || "Bryce Tech Report",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.report_type ? `Report type: ${str(r.report_type)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      report_type: r.report_type,
      published_at: r.published_at,
    }),
  },

  // ── Space Capital Reports ──────────────────────────────────────────────
  {
    name: "space_capital_reports",
    sourceType: "space_capital",
    titleFn: (r) => str(r.title) || "Space Capital Report",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.quarter ? `Quarter: ${str(r.quarter)}.` : "",
        r.year ? `Year: ${str(r.year)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      quarter: r.quarter,
      year: r.year,
      published_at: r.published_at,
    }),
  },

  // ── SIA Resources ─────────────────────────────────────────────────────
  {
    name: "sia_resources",
    sourceType: "sia_resource",
    titleFn: (r) => str(r.title) || "SIA Resource",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.resource_type ? `Type: ${str(r.resource_type)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      resource_type: r.resource_type,
      published_at: r.published_at,
    }),
  },

  // ── NATO Procurement ───────────────────────────────────────────────────
  {
    name: "nato_procurement",
    sourceType: "nato",
    titleFn: (r) => str(r.title) || "NATO Procurement",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.reference_number ? `Reference: ${str(r.reference_number)}.` : "",
        r.procurement_type ? `Type: ${str(r.procurement_type)}.` : "",
        r.deadline ? `Deadline: ${str(r.deadline)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      reference_number: r.reference_number,
      procurement_type: r.procurement_type,
      deadline: r.deadline,
      published_at: r.published_at,
    }),
  },

  // ── ESA Copernicus ─────────────────────────────────────────────────────
  {
    name: "esa_copernicus",
    sourceType: "esa_copernicus",
    titleFn: (r) => str(r.title) || "ESA Copernicus Dataset",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.dataset ? `Dataset: ${str(r.dataset)}.` : "",
        r.satellite ? `Satellite: ${str(r.satellite)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      dataset: r.dataset,
      satellite: r.satellite,
      published_at: r.published_at,
    }),
  },

  // ── ITU BRIFIC ─────────────────────────────────────────────────────────
  {
    name: "itu_brific",
    sourceType: "itu_brific",
    titleFn: (r) => str(r.title) || "ITU BRIFIC Entry",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.frequency_band ? `Frequency band: ${str(r.frequency_band)}.` : "",
        r.administration ? `Administration: ${str(r.administration)}.` : "",
        r.service_type ? `Service type: ${str(r.service_type)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      frequency_band: r.frequency_band,
      administration: r.administration,
      service_type: r.service_type,
      published_at: r.published_at,
    }),
  },

  // ── Congressional Space Budget ─────────────────────────────────────────
  {
    name: "congressional_space_budget",
    sourceType: "space_budget",
    titleFn: (r) => str(r.title) || "Space Budget Entry",
    contentFn: (r) => {
      const parts = [
        str(r.title) + ".",
        str(r.description),
        r.agency ? `Agency: ${str(r.agency)}.` : "",
        r.fiscal_year ? `Fiscal year: ${str(r.fiscal_year)}.` : "",
        r.amount_millions ? `Amount: $${str(r.amount_millions)}M.` : "",
        r.budget_type ? `Budget type: ${str(r.budget_type)}.` : "",
        r.published_at ? `Published: ${str(r.published_at)}.` : "",
      ];
      return parts.filter(Boolean).join(" ").slice(0, 8000);
    },
    urlFn: (r) => str(r.url) || null,
    metadataFn: (r) => ({
      agency: r.agency,
      fiscal_year: r.fiscal_year,
      amount_millions: r.amount_millions,
      budget_type: r.budget_type,
      published_at: r.published_at,
    }),
  },
];

async function main() {
  console.log("=== Session E-EMBEDDINGS: Regenerating ALL Embeddings (25 tables) ===\n");
  console.log(`Config: batch=${BATCH_SIZE}, delay=${DELAY_MS}ms\n`);

  // Clear existing embeddings to avoid duplicates on re-run
  const { error: clearError } = await supabase
    .from("embeddings")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (clearError) {
    console.error("Warning: Could not clear embeddings table:", clearError.message);
  } else {
    console.log("Cleared existing embeddings table\n");
  }

  let totalGenerated = 0;
  const tableCounts: Record<string, number> = {};

  for (const table of tables) {
    console.log(`\nProcessing ${table.name} → source_type: "${table.sourceType}"...`);

    // Fetch all rows (with per-table cap where needed)
    const rowLimit = TABLE_ROW_LIMITS[table.name];
    let allRows: Record<string, unknown>[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const remaining = rowLimit ? rowLimit - allRows.length : PAGE_SIZE;
      if (rowLimit && remaining <= 0) break;
      const fetchSize = Math.min(PAGE_SIZE, remaining || PAGE_SIZE);

      let query = supabase
        .from(table.name)
        .select("*");

      // For capped tables, order by most recent first
      if (rowLimit) {
        query = query.order("created_at", { ascending: false });
      }

      const { data: rows, error } = await query
        .range(offset, offset + fetchSize - 1);

      if (error) {
        console.log(`  ✗ Skipped ${table.name}: ${error.message}`);
        break;
      }

      if (!rows || rows.length === 0) break;
      allRows = allRows.concat(rows as Record<string, unknown>[]);
      offset += rows.length;
      if (rows.length < fetchSize) break;
    }

    if (rowLimit && allRows.length > 0) {
      console.log(`  (capped at ${rowLimit} rows)`);
    }

    if (allRows.length === 0) {
      console.log(`  ○ Skipped ${table.name}: no rows`);
      continue;
    }

    console.log(`  ${allRows.length} rows to process`);
    let tableCount = 0;

    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const embedRecords: Array<{
        content: string;
        metadata: Record<string, unknown>;
        source_type: string;
        source_url: string | null;
        title: string;
        embedding: string;
        embedding_model: string;
      }> = [];

      for (const row of batch) {
        const content = table.contentFn(row);
        if (!content.trim()) continue;

        const embedding = await generateEmbedding(content);
        if (embedding.length === 0) continue;

        embedRecords.push({
          content,
          metadata: table.metadataFn(row),
          source_type: table.sourceType,
          source_url: table.urlFn(row),
          title: table.titleFn(row),
          embedding: JSON.stringify(embedding),
          embedding_model: "text-embedding-3-small",
        });
      }

      // Batch insert for efficiency
      if (embedRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("embeddings")
          .insert(embedRecords);

        if (insertError) {
          console.error(`  Error inserting ${table.name} batch:`, insertError.message);
          // Fall back to one-by-one insert
          for (const rec of embedRecords) {
            const { error: singleError } = await supabase
              .from("embeddings")
              .insert(rec);
            if (!singleError) {
              tableCount++;
              totalGenerated++;
            }
          }
        } else {
          tableCount += embedRecords.length;
          totalGenerated += embedRecords.length;
        }
      }

      console.log(
        `  [${Math.min(i + BATCH_SIZE, allRows.length)}/${allRows.length}] ${table.name}: ${tableCount} embedded`
      );

      if (i + BATCH_SIZE < allRows.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    tableCounts[table.name] = tableCount;
    console.log(`  ✓ ${table.name}: ${tableCount} embeddings generated`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n=== EMBEDDING GENERATION SUMMARY ===\n");
  for (const [tableName, count] of Object.entries(tableCounts)) {
    console.log(`  ${tableName.padEnd(25)} ${count}`);
  }
  console.log(`  ${"─".repeat(35)}`);
  console.log(`  ${"TOTAL".padEnd(25)} ${totalGenerated}`);

  // Final count verification
  const { count } = await supabase
    .from("embeddings")
    .select("*", { count: "exact", head: true });
  console.log(`\nEmbeddings table now has ${count} rows`);

  if (totalGenerated >= 3000) {
    console.log("✓ Target of 3000+ embeddings reached!");
  } else {
    console.log(`⚠ Below 3000 target — ${3000 - totalGenerated} more needed`);
  }
}

main().catch(console.error);
