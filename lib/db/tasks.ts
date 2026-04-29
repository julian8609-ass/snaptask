import { getSupabaseServer } from '@/lib/db/supabase';
import db from '@/lib/db';
import { Task, Subtask, Reminder, User } from '@/types';

function shouldFallbackToLocal(error?: { message?: string; msg?: string; code?: string }): boolean {
  const missingEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (missingEnv) return true;
  if (!error) return false;
  const message = String(error?.message || error?.msg || '');
  const code = String(error?.code || '');
  return (
    code === 'PGRST205' ||
    message.includes('Could not find the table') ||
    message.includes('schema cache')
  );
}

/**
 * Create a new task
 */
export async function createTask(
  userId: string,
  task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.warn('Supabase createTask failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return db.tasks.create({ user_id: userId, ...task });
    }
    return null;
  }

  return data;
}

/**
 * Get all tasks for a user
 */
export async function getTasks(
  userId: string,
  status?: string,
  category?: string
): Promise<Task[]> {
  let query = supabase.from('tasks').select('*').eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('Supabase getTasks failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return (await db.tasks.getAll()).filter((task) => {
        if (task.user_id !== userId) return false;
        if (status && task.status !== status) return false;
        if (category && task.category !== category) return false;
        return true;
      });
    }
    return [];
  }

  return data || [];
}

/**
 * Get a single task
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.warn('Supabase getTask failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return db.tasks.getById(taskId);
    }
    return null;
  }

  if (!data) {
    return db.tasks.getById(taskId);
  }

  return data;
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.warn('Supabase updateTask failed, falling back to local DB:', error);
    const localTask = await db.tasks.getById(taskId);
    if (localTask) {
      return db.tasks.update(taskId, updates);
    }
    if (shouldFallbackToLocal(error)) {
      return db.tasks.update(taskId, updates);
    }
    return null;
  }

  if (!data) {
    const localTask = await db.tasks.getById(taskId);
    if (localTask) {
      return db.tasks.update(taskId, updates);
    }
  }

  return data;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.warn('Supabase deleteTask failed, falling back to local DB:', error);
    const localTask = await db.tasks.getById(taskId);
    if (localTask) {
      return db.tasks.delete(taskId);
    }
    if (shouldFallbackToLocal(error)) {
      return db.tasks.delete(taskId);
    }
    return false;
  }

  return true;
}

/**
 * Add a subtask
 */
export async function addSubtask(
  taskId: string,
  title: string,
  description?: string
): Promise<Subtask | null> {
  const task = await getTask(taskId);
  if (!task) return null;

  const newSubtask: Subtask = {
    id: `${taskId}_subtask_${Date.now()}`,
    task_id: taskId,
    title,
    completed: false,
    order: (task.subtasks?.length || 0) + 1,
  };

  const updatedSubtasks = [...(task.subtasks || []), newSubtask];
  await updateTask(taskId, { subtasks: updatedSubtasks });

  return newSubtask;
}

/**
 * Update subtask
 */
export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  updates: Partial<Subtask>
): Promise<Subtask | null> {
  const task = await getTask(taskId);
  if (!task || !task.subtasks) return null;

  const updatedSubtasks = task.subtasks.map((st) =>
    st.id === subtaskId ? { ...st, ...updates } : st
  );

  await updateTask(taskId, { subtasks: updatedSubtasks });

  return updatedSubtasks.find((st) => st.id === subtaskId) || null;
}

/**
 * Create a reminder
 */
export async function createReminder(
  taskId: string,
  userId: string,
  remindAt: string
): Promise<Reminder | null> {
  const { data, error } = await supabase
    .from('reminders')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        remind_at: remindAt,
        type: 'in_app',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.warn('Supabase createReminder failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return db.reminders.create({
        task_id: taskId,
        user_id: userId,
        remind_at: remindAt,
        type: 'in_app',
        status: 'pending',
      });
    }
    return null;
  }

  return data;
}

/**
 * Get reminders for a user
 */
export async function getReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.warn('Supabase getReminders failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return db.reminders.getByUser(userId);
    }
    return [];
  }

  return data || [];
}

/**
 * Mark reminder as sent
 */
export async function markReminderAsSent(reminderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'sent' })
    .eq('id', reminderId);

  if (error) {
    console.warn('Supabase markReminderAsSent failed, falling back to local DB:', error);
    if (shouldFallbackToLocal(error)) {
      return db.reminders.markAsSent(reminderId);
    }
    return false;
  }

  return true;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ preferences })
    .eq('id', userId);

  if (error) {
    console.error('Error updating preferences:', error);
    return false;
  }

  return true;
}
