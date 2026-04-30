import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-safe';

const rankThresholds = [
  { xp: 1500, rank: 'Master' },
  { xp: 900, rank: 'Diamond' },
  { xp: 500, rank: 'Gold' },
  { xp: 250, rank: 'Silver' },
  { xp: 0, rank: 'Bronze' },
];

function computeRank(xp: number) {
  return rankThresholds.find((threshold) => xp >= threshold.xp)?.rank ?? 'Bronze';
}

function getSupabase() {
  return getSupabaseClient();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { userId, taskId, action } = body;

    if (!userId || !taskId) {
      return NextResponse.json({ error: 'userId and taskId required' }, { status: 400 });
    }

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      console.error('Task error:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (action === 'complete') {
      if (task.status === 'completed') {
        return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActivityDate = userProfile.last_activity_date ? new Date(userProfile.last_activity_date) : null;
      const todayDate = new Date(today);
      const isYesterday = lastActivityDate
        ? new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            todayDate.getDate() - 1
          ).toISOString().split('T')[0] === userProfile.last_activity_date
        : false;

      const streak = isYesterday ? (userProfile.streak_days || 0) + 1 : 1;
      const xpAward = task.xp_reward || 10;
      const newXp = (userProfile.total_xp || 0) + xpAward;
      const rank = computeRank(newXp);
      const newLevel = Math.floor(newXp / 500) + 1;

      // Update task
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      // Log XP
      await supabase
        .from('xp_logs')
        .insert([
          {
            user_id: userId,
            task_id: taskId,
            xp_amount: xpAward,
            xp_type: 'task_completed',
            description: `Completed task: ${task.title}`,
          },
        ]);

      // Update user profile
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .update({
          total_xp: newXp,
          streak_days: streak,
          level: newLevel,
          last_activity_date: today,
        })
        .eq('user_id', userId)
        .select();

      return NextResponse.json({
        task: { ...task, status: 'completed' },
        profile: updatedProfile?.[0],
        xpAwarded: xpAward,
        rank,
      });
    }

    if (action === 'skip') {
      await supabase
        .from('tasks')
        .update({
          status: 'todo',
          description: (task.description || '') + ' (simplified)',
        })
        .eq('id', taskId);

      return NextResponse.json({ task: { ...task, status: 'skipped' } });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('XP update error:', error);
    return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 });
  }
}

