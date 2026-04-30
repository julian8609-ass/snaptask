import { createClient } from '@supabase/supabase-js';

let cachedClient: any = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (url && key) {
    cachedClient = createClient(url, key);
  } else {
    // Dummy client for build time / no env
    cachedClient = {
      from: (table: string) => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        eq: () => ({}) as any,
        update: () => ({}) as any,
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        order: () => ({}) as any,
        limit: () => ({}) as any,
      }),
    };
  }
  return cachedClient;
}

export default getSupabaseClient;

