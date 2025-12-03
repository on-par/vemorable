import { createClient } from '@supabase/supabase-js';
import type { Dump, SearchResult } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Some features will be unavailable.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Fetch all dumps for the current user
 */
export async function fetchDumps(): Promise<Dump[]> {
  const { data, error } = await supabase
    .from('dumps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch dumps: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single dump by ID
 */
export async function fetchDumpById(id: string): Promise<Dump | null> {
  const { data, error } = await supabase
    .from('dumps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch dump: ${error.message}`);
  }

  return data;
}

/**
 * Fetch dumps by tag
 */
export async function fetchDumpsByTag(tag: string): Promise<Dump[]> {
  const { data, error } = await supabase
    .from('dumps')
    .select('*')
    .contains('tags', [tag])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch dumps by tag: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all unique tags for the current user
 */
export async function fetchAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('dumps')
    .select('tags');

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  const allTags = new Set<string>();
  data?.forEach((dump) => {
    dump.tags?.forEach((tag: string) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Delete a dump by ID
 */
export async function deleteDump(id: string): Promise<void> {
  const { error } = await supabase
    .from('dumps')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete dump: ${error.message}`);
  }
}

/**
 * Process a new dump via Edge Function
 */
export async function processDump(
  audioBase64: string,
  insightMode: string,
  promptShown: string
): Promise<{ id: string; transcript: string; one_thing: string; tags: string[]; duration_seconds: number }> {
  const { data, error } = await supabase.functions.invoke('process-dump', {
    body: {
      audio_base64: audioBase64,
      insight_mode: insightMode,
      prompt_shown: promptShown,
    },
  });

  if (error) {
    throw new Error(`Failed to process dump: ${error.message}`);
  }

  return data;
}

/**
 * Search dumps using semantic search via Edge Function
 */
export async function searchDumps(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const { data, error } = await supabase.functions.invoke('search-dumps', {
    body: {
      query,
      limit,
    },
  });

  if (error) {
    throw new Error(`Failed to search dumps: ${error.message}`);
  }

  return data.results || [];
}

/**
 * Sign in with magic link
 */
export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'vemorable://auth/callback',
    },
  });

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return data.session;
}
