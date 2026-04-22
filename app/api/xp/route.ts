import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const taskId = String(body.taskId || '');
    const action = String(body.action || 'complete');

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (action === 'complete') {
      if (task.status === 'completed') {
        return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
      }

      const today = new Date();
      const lastCompleted = user.lastCompletedAt ? new Date(user.lastCompletedAt) : null;
      const isYesterday = lastCompleted
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime() ===
          new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate()).getTime()
        : false;

      const streak = isYesterday ? user.streak + 1 : 1;
      const xpAward = task.xp;
      const newXp = user.xp + xpAward;
      const rank = computeRank(newXp);
      const updatedEnergy = Math.min(5, user.energy + 1);

      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'completed' },
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: newXp,
          streak,
          rank,
          lastCompletedAt: today,
          energy: updatedEnergy,
        },
      });

      return NextResponse.json({ task: { ...task, status: 'completed' }, profile: updatedUser });
    }

    if (action === 'skip') {
      const skipped = await prisma.task.update({
        where: { id: task.id },
        data: {
          skipCount: task.skipCount + 1,
          title: task.title + ' (simplified)',
          status: 'skipped',
        },
      });
      return NextResponse.json({ task: skipped });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 });
  }
}
