// Signaic Database Types

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[] | null;
  entities: EntityMention[] | null;
  created_at: string;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  url?: string;
  snippet?: string;
  date?: string;
}

export interface EntityMention {
  id: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
}

export interface Brief {
  id: string;
  user_id: string;
  title: string | null;
  config: BriefConfig | null;
  content: string | null;
  created_at: string;
}

export interface BriefConfig {
  dateRange: { start: string; end: string };
  sectors: string[];
  entities: string[];
  depth: "quick" | "standard" | "deep";
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  entity_id: string;
  created_at: string;
  entity?: Entity;
}

export interface DailyBriefing {
  id: string;
  briefing_date: string;
  items: BriefingItem[];
  sources_consulted: SourceConsulted[];
  generated_at: string;
}

export interface BriefingItem {
  headline: string;
  synthesis: string;
  entities: EntityMention[];
  impact: "high" | "medium" | "low";
  sources: Source[];
}

export interface SourceConsulted {
  name: string;
  count: number;
  lastUpdated: string;
}

export interface Entity {
  id: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
  sectors: string[];
  description?: string;
  last_activity?: string;
  source_counts?: Record<string, number>;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
  error?: string;
}

// Data table types

export interface Company {
  id: string;
  name: string;
  ticker: string | null;
  type: string;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  founded_year: number | null;
  employee_count: number | null;
  tracked: boolean;
  sector_tags: string[];
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface FccFiling {
  id: string;
  file_number: string | null;
  company_id: string | null;
  applicant_name: string | null;
  filing_type: string | null;
  call_sign: string | null;
  frequency_bands: string[];
  filing_date: string | null;
  status: string | null;
  raw_text: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrbitalData {
  id: string;
  norad_cat_id: string | null;
  object_name: string | null;
  company_id: string | null;
  object_type: string | null;
  orbit_type: string | null;
  launch_date: string | null;
  period: number | null;
  inclination: number | null;
  apoapsis: number | null;
  periapsis: number | null;
  current_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecFiling {
  id: string;
  company_id: string | null;
  filing_type: string | null;
  filed_date: string | null;
  accession_number: string | null;
  description: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patent {
  id: string;
  patent_number: string | null;
  company_id: string | null;
  title: string | null;
  abstract: string | null;
  filing_date: string | null;
  status: string | null;
  technology_area: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovContract {
  id: string;
  contract_number: string | null;
  company_id: string | null;
  awarding_agency: string | null;
  contract_title: string | null;
  contract_value: number | null;
  period_start: string | null;
  period_end: string | null;
  description: string | null;
  contract_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title: string | null;
  source: string | null;
  url: string | null;
  published_date: string | null;
  company_id: string | null;
  summary: string | null;
  sentiment: string | null;
  category: string | null;
  created_at: string;
}
