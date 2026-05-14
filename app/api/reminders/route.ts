import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';
import { isSupabaseUnavailableError, markSupabaseUnavailable, shouldUseSupabaseFallbackSoon } from '@/lib/supabase-safe';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('Reminders API - Received userId:', userId);

    if (!userId) {
      console.error('userId is missing');
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (await shouldUseSupabaseFallbackSoon()) {
      const reminders = await db.reminders.getByUser(userId);
      console.log('Supabase fallback active; returning local reminders:', reminders.length);
      return NextResponse.json(reminders);
    }

    const supabase = getSupabaseServer();
    console.log('Fetching reminders for userId:', userId);
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      if (isSupabaseUnavailableError(error)) {
        markSupabaseUnavailable();
        const localReminders = await db.reminders.getByUser(userId);
        console.warn('Supabase unavailable; returning local fallback reminders:', localReminders.length);
        return NextResponse.json(localReminders);
      }
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

    if (await shouldUseSupabaseFallbackSoon()) {
      const reminder = await db.reminders.create({
        user_id: userId,
        task_id: taskId || undefined,
        title,
        reminder_time: reminderTime,
        reminder_type: reminderType || 'notification',
        is_sent: false,
      });
      console.log('Supabase fallback active; created local reminder:', reminder.id);
      return NextResponse.json(reminder, { status: 201 });
    }

    const supabase = getSupabaseServer();
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
      if (isSupabaseUnavailableError(error)) {
        markSupabaseUnavailable();
        const localReminder = await db.reminders.create({
          user_id: userId,
          task_id: taskId || undefined,
          title,
          reminder_time: reminderTime,
          reminder_type: reminderType || 'notification',
          is_sent: false,
        });
        console.warn('Supabase unavailable; created local fallback reminder:', localReminder.id);
        return NextResponse.json(localReminder, { status: 201 });
      }
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
