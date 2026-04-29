import { createClient } from '@supabase/supabase-js';

let cachedClient: any = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // CRITICAL: Build-safe dummy - no throw!
    cachedClient = {
      from: (table: string) => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase disabled - missing env vars' } }),
        eq: () => ({}),
        update: () => Promise.resolve({ data: null }),
        insert: () => Promise.resolve({ data: null }),
        delete: () => Promise.resolve({ data: null }),
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase disabled' } }),
        order: () => ({}),
        limit: () => ({}),
      }),
    };
    return cachedClient;
  }

  cachedClient = createClient(url, key);
  return cachedClient;
}

