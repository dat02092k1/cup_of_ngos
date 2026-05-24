export type PostStatus = "draft" | "published";

export interface PostRow {
  id: string;
  title: string;
  slug: string;
  content_json: unknown;
  content_html: string;
  excerpt: string;
  cover_image_url: string | null;
  status: PostStatus;
  published_at: string | null;
  tags: string[];
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

// Explicit Insert/Update types: use Record<string, unknown>-compatible fields so that
// the Supabase SupabaseClient<Database> generic resolves correctly.
// content_json uses Record<string, unknown> (not `unknown`) to avoid the Supabase type
// chain resolving to `never`.
export type PostInsert = {
  id?: string;
  title: string;
  slug: string;
  content_json: Record<string, unknown>;
  content_html?: string;
  excerpt?: string;
  cover_image_url?: string | null;
  status?: PostStatus;
  published_at?: string | null;
  tags?: string[];
  reading_time_minutes?: number;
  created_at?: string;
  updated_at?: string;
};

export type PostUpdate = {
  id?: string;
  title?: string;
  slug?: string;
  content_json?: Record<string, unknown>;
  content_html?: string;
  excerpt?: string;
  cover_image_url?: string | null;
  status?: PostStatus;
  published_at?: string | null;
  tags?: string[];
  reading_time_minutes?: number;
  created_at?: string;
  updated_at?: string;
};

// Database type following Supabase's expected structure for SupabaseClient<Database>.
// TypeScript 6 requires Row/Insert/Update to explicitly satisfy Record<string, unknown>
// (the GenericTable constraint). We intersect with Record<string, unknown> on the Row
// type to satisfy this while keeping strong named property types via PostRow.
export interface Database {
  public: {
    Tables: {
      posts: {
        Row: PostRow & Record<string, unknown>;
        Insert: PostInsert & Record<string, unknown>;
        Update: PostUpdate & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
