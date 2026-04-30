import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-safe';

const xpByDifficulty = {
  easy: 10,
  medium: 20,
  hard: 35,
};

const difficultyByPriority = {
  low: 'easy',
  medium: 'medium',
  high: 'hard',
  urgent: 'hard',
} as const;

const priorityByDifficulty = {
  easy: 'low',
  medium: 'medium',
  hard: 'high',
} as const;

const energyByDifficulty = {
  easy: 1,
  medium: 2,
  hard: 3,
} as const;

function normalizeTask(task: any) {
  const priority = (task.priority || 'medium') as keyof typeof difficultyByPriority;
  const difficulty = (task.difficulty || difficultyByPriority[priority] || 'medium') as 'easy' | 'medium' | 'hard';
  const dueDate = task.due_date ?? null;

  return {
    ...task,
    priority,
    difficulty,
    energy: task.energy ?? energyByDifficulty[difficulty] ?? 2,
    xp: task.xp ?? task.xp_reward ?? xpByDifficulty[difficulty] ?? 10,
    source: task.source ?? 'USER',
    skipCount: task.skipCount ?? task.skip_count ?? 0,
    scheduledDate: task.scheduledDate ?? dueDate,
    scheduledTime: task.scheduledTime ?? null,
  };
}

function getSupabase() {
  return getSupabaseClient();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
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
    return NextResponse.json((tasks || []).map(normalizeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { userId, title, description } = body;

    console.log('Creating task for userId:', userId, 'title:', title);

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    const difficulty = (body.difficulty || 'medium') as 'easy' | 'medium' | 'hard';
    const priorityInput = (body.priority || priorityByDifficulty[difficulty] || 'medium') as keyof typeof difficultyByPriority;
    const dueDate = body.dueDate || body.scheduledDate || null;
    const energy = typeof body.energy === 'number' ? body.energy : energyByDifficulty[difficulty] ?? 2;
    const xpReward = typeof body.xp === 'number' ? body.xp : typeof body.xp_reward === 'number' ? body.xp_reward : xpByDifficulty[difficulty] ?? 10;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          priority: priorityInput,
          status: 'todo',
          due_date: dueDate,
          xp_reward: xpReward,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Task created successfully');
    return NextResponse.json(normalizeTask(task?.[0]), { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}

