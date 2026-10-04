import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    !supabaseUrl.includes('your-project')
  );
}

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      supabaseUrl!,
      supabaseAnonKey!
    );
  }

  return browserClient;
}

// Fallback or active client instance (creates a client if configured, or a safe stub/client with fallback url)
export const supabase = isSupabaseConfigured()
  ? createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
