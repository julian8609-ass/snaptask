import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const xpByDifficulty = {
  easy: 10,
  medium: 20,
  hard: 35,
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    console.log('Tasks API - Received userId:', userId);

    if (!userId) {
      console.error('userId is missing');
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Fetching tasks for userId:', userId);
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully fetched tasks:', tasks?.length || 0);
    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, priority, dueDate } = body;

    console.log('Creating task for userId:', userId, 'title:', title);

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          priority: priority || 'medium',
          status: 'todo',
          due_date: dueDate || null,
          xp_reward: xpByDifficulty[priority as keyof typeof xpByDifficulty] ?? 10,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Task created successfully');
    return NextResponse.json(task?.[0], { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
