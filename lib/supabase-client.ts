// lib/supabase-client.ts - Properly authenticated Supabase client

import { getSupabaseClient, isSupabaseServiceConfigured } from './supabase-safe';

import { createClient as createServiceClient } from '@supabase/supabase-js';

let lazyClient: ReturnType<typeof getSupabaseClient> | null = null;
function resolveClient() {
  if (!lazyClient) lazyClient = getSupabaseClient();
  return lazyClient;
}

export const supabase = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    const client = resolveClient() as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as ReturnType<typeof getSupabaseClient>;

// Server-side admin client factory (lazy, avoids build-time errors)
let cachedSupabaseAdmin: any = null;

export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  if (!isSupabaseServiceConfigured()) {
    console.warn('Supabase admin not configured (missing URL or service key, or invalid URL)');
    cachedSupabaseAdmin = null;
    return null;
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  try {
    cachedSupabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey);
  } catch (e) {
    console.warn('[supabase] getSupabaseAdmin createClient failed:', e);
    cachedSupabaseAdmin = null;
  }
  return cachedSupabaseAdmin;
}

// Example: Insert a task with proper authentication
export async function insertTask(
  userId: string,
  title: string,
  description: string,
  priority: string = 'medium'
) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title,
          description,
          priority,
          status: 'todo',
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting task:', error);
      return { success: false, error: error.message };
    }

    console.log('Task inserted:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: 'Unknown error' };
  }
}

// Updated admin insert function
export async function insertTaskAdmin(
  userId: string,
  title: string,
  description: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert([
      {
        user_id: userId,
        title,
        description,
        status: 'todo',
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data;
}
