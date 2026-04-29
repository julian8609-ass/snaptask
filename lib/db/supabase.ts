import { getSupabaseClient } from '../../lib/supabase';

import { createClient } from '@supabase/supabase-js';

// Lazy server-side Supabase client factory (prevents build-time errors)
let cachedSupabaseServer: any = null;

export function getSupabaseServer() {
  if (cachedSupabaseServer) return cachedSupabaseServer;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase server client not configured');
    cachedSupabaseServer = getSupabaseClient(); // fallback
    return cachedSupabaseServer;
  }

  try {
    cachedSupabaseServer = createClient(supabaseUrl, supabaseServiceKey);
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    cachedSupabaseServer = getSupabaseClient();
  }
  return cachedSupabaseServer;
}

// Client for browser/client-side operations (unchanged)
export const supabase = getSupabaseClient();
export default supabase;
