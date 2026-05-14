import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseUnavailableError, markSupabaseUnavailable, shouldUseSupabaseFallbackSoon } from '@/lib/supabase-safe';
import db from '@/lib/db';

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

function isSupabaseNotConfigured(error: { code?: string; message?: string } | null | undefined) {
  return isSupabaseUnavailableError(error);
}

async function getLocalTasksForUser(userId: string) {
  const localTasks = (await db.tasks.getAll()).filter((task) => task.user_id === userId);
  return localTasks.map(normalizeTask);
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

    if (await shouldUseSupabaseFallbackSoon()) {
      const localTasks = await getLocalTasksForUser(userId);
      console.log('Supabase fallback active; returning local tasks:', localTasks.length);
      return NextResponse.json(localTasks);
    }

    console.log('Fetching tasks for userId:', userId);
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      if (isSupabaseNotConfigured(error)) {
        markSupabaseUnavailable();
        const localTasks = await getLocalTasksForUser(userId);
        console.warn('Supabase unavailable; returning local fallback tasks:', localTasks.length);
        return NextResponse.json(localTasks);
      }
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

    if (await shouldUseSupabaseFallbackSoon()) {
      const localTask = await db.tasks.create({
        user_id: userId,
        title: String(title).trim(),
        description: description ? String(description).trim() : undefined,
        priority: priorityInput,
        status: 'todo',
        due_date: dueDate || undefined,
        energy,
        xp: xpReward,
        source: 'USER',
        scheduledDate: dueDate,
        scheduledTime: null,
      });
      console.log('Supabase fallback active; created local task:', localTask.id);
      return NextResponse.json(normalizeTask(localTask), { status: 201 });
    }

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
      if (isSupabaseNotConfigured(error)) {
        markSupabaseUnavailable();
        console.warn('Supabase unavailable; creating local fallback task.');
        const localTask = await db.tasks.create({
          user_id: userId,
          title: String(title).trim(),
          description: description ? String(description).trim() : undefined,
          priority: priorityInput,
          status: 'todo',
          due_date: dueDate || undefined,
          energy,
          xp: xpReward,
          source: 'USER',
          scheduledDate: dueDate,
          scheduledTime: null,
        });
        return NextResponse.json(normalizeTask(localTask), { status: 201 });
      }
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

