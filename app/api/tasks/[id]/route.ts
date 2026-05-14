import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';
import { isSupabaseUnavailableError, markSupabaseUnavailable, shouldUseSupabaseFallbackSoon } from '@/lib/supabase-safe';
import db from '@/lib/db';
import type { Task } from '@/types';

type Params = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getLocalTask(taskId: string, userId: string) {
  const task = await db.tasks.getById(taskId);
  if (!task || task.user_id !== userId) return null;
  return task;
}

function localUpdatesFromBody(body: Partial<Task>) {
  const updates: Partial<Task> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.scheduledDate !== undefined) updates.scheduledDate = body.scheduledDate;
  if (body.scheduledTime !== undefined) updates.scheduledTime = body.scheduledTime;
  return updates;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (await shouldUseSupabaseFallbackSoon()) {
      const task = await getLocalTask(resolvedParams.id, userId);
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json(task);
    }

    const supabase = getSupabaseServer();
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      console.error('Task error:', error);
      if (isSupabaseUnavailableError(error)) {
        markSupabaseUnavailable();
        const localTask = await getLocalTask(resolvedParams.id, userId);
        if (localTask) return NextResponse.json(localTask);
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (await shouldUseSupabaseFallbackSoon()) {
      const task = await getLocalTask(resolvedParams.id, userId);
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

      const updated = await db.tasks.update(resolvedParams.id, localUpdatesFromBody(body));
      return NextResponse.json(updated);
    }

    const supabase = getSupabaseServer();
    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      console.error('Task error:', taskError);
      if (isSupabaseUnavailableError(taskError)) {
        markSupabaseUnavailable();
        const localTask = await getLocalTask(resolvedParams.id, userId);
        if (!localTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const updated = await db.tasks.update(resolvedParams.id, localUpdatesFromBody(body));
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        title: body.title ?? task.title,
        description: body.description ?? task.description,
        status: body.status ?? task.status,
        priority: body.priority ?? task.priority,
        due_date: body.due_date ?? task.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolvedParams.id)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      if (isSupabaseUnavailableError(updateError)) {
        markSupabaseUnavailable();
        const updated = await db.tasks.update(resolvedParams.id, localUpdatesFromBody(body));
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updated?.[0]);
  } catch (error) {
    console.error('Patch task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (await shouldUseSupabaseFallbackSoon()) {
      const task = await getLocalTask(resolvedParams.id, userId);
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

      const success = await db.tasks.delete(resolvedParams.id);
      return NextResponse.json({ success });
    }

    const supabase = getSupabaseServer();
    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      console.error('Task error:', taskError);
      if (isSupabaseUnavailableError(taskError)) {
        markSupabaseUnavailable();
        const localTask = await getLocalTask(resolvedParams.id, userId);
        if (!localTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const success = await db.tasks.delete(resolvedParams.id);
        return NextResponse.json({ success });
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      if (isSupabaseUnavailableError(deleteError)) {
        markSupabaseUnavailable();
        const success = await db.tasks.delete(resolvedParams.id);
        return NextResponse.json({ success });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
