// lib/supabase-client.ts - Properly authenticated Supabase client

import { getSupabaseClient } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = getSupabaseClient();

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

// Example: Insert with Service Role Key (server-side only!)
// This bypasses RLS - use only on backend for admin operations
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey
  ? createServiceClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function insertTaskAdmin(
  userId: string,
  title: string,
  description: string
) {
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
