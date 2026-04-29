import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

const supabase = getSupabaseServer();

type Params = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      console.error('Task error:', error);
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

    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      console.error('Task error:', taskError);
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

    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      console.error('Task error:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
