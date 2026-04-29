// lib/supabase-client.ts - Properly authenticated Supabase client

import { getSupabaseClient } from './supabase';

import { createClient as createServiceClient } from '@supabase/supabase-js';

export const supabase = getSupabaseClient();

// Server-side admin client factory (lazy, avoids build-time errors)
let cachedSupabaseAdmin: any = null;

export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin not configured (missing URL or service key)');
    cachedSupabaseAdmin = null;
    return null;
  }

  cachedSupabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey);
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
