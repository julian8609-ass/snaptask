import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('Reminders API - Received userId:', userId);

    if (!userId) {
      console.error('userId is missing');
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Fetching reminders for userId:', userId);
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully fetched reminders:', reminders?.length || 0);
    return NextResponse.json(reminders || []);
  } catch (error) {
    console.error('Unexpected error in reminders API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskId, title, reminderTime, reminderType } = body;

    console.log('Creating reminder for userId:', userId);

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert([
        {
          user_id: userId,
          task_id: taskId || null,
          title,
          reminder_time: reminderTime,
          reminder_type: reminderType || 'notification',
          is_sent: false,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Reminder created successfully');
    return NextResponse.json(reminder?.[0], { status: 201 });
  } catch (error) {
    console.error('Reminder creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
