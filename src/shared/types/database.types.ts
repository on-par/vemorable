// Generated from Supabase schema
// This file would typically be auto-generated using `supabase gen types typescript`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string | null
          raw_transcript: string | null
          processed_content: string | null
          summary: string | null
          type: 'text' | 'voice'
          audio_url: string | null
          duration: number | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at: string | null
          processing_completed_at: string | null
          has_embeddings: boolean
          embedding: number[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content?: string | null
          raw_transcript?: string | null
          processed_content?: string | null
          summary?: string | null
          type: 'text' | 'voice'
          audio_url?: string | null
          duration?: number | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          has_embeddings?: boolean
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string | null
          raw_transcript?: string | null
          processed_content?: string | null
          summary?: string | null
          type?: 'text' | 'voice'
          audio_url?: string | null
          duration?: number | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          has_embeddings?: boolean
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
          description: string | null
          user_id: string
          parent_id: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
          description?: string | null
          user_id: string
          parent_id?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
          description?: string | null
          user_id?: string
          parent_id?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          note_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          note_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          user_id: string
          type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'topic'
          title: string
          content: string
          note_ids: string[]
          date_start: string
          date_end: string
          metadata: Json | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'topic'
          title: string
          content: string
          note_ids: string[]
          date_start: string
          date_end: string
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'daily' | 'weekly' | 'monthly' | 'custom' | 'topic'
          title?: string
          content?: string
          note_ids?: string[]
          date_start?: string
          date_end?: string
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          theme: 'light' | 'dark' | 'system'
          language: string
          timezone: string
          email_notifications: boolean
          push_notifications: boolean
          auto_transcribe: boolean
          auto_summarize: boolean
          default_note_type: 'text' | 'voice'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          auto_transcribe?: boolean
          auto_summarize?: boolean
          default_note_type?: 'text' | 'voice'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          auto_transcribe?: boolean
          auto_summarize?: boolean
          default_note_type?: 'text' | 'voice'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_notes: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}