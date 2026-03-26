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
