import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const xpByDifficulty = {
  easy: 10,
  medium: 20,
  hard: 35,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const difficulty = body.difficulty || 'easy';
    const energy = Number(body.energy || (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1));
    const source = body.source === 'AI' ? 'AI' : 'USER';

    // Parse scheduled date properly
    let scheduledDate = null;
    if (body.scheduledDate) {
      const dateStr = String(body.scheduledDate).trim();
      if (dateStr) {
        // Handle YYYY-MM-DD format from date input
        const [year, month, day] = dateStr.split('-');
        scheduledDate = new Date(Number(year), Number(month) - 1, Number(day));
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: String(body.description || '').trim() || null,
        difficulty,
        energy,
        source,
        xp: xpByDifficulty[difficulty as keyof typeof xpByDifficulty] ?? 10,
        userId: user.id,
        scheduledDate,
        scheduledTime: String(body.scheduledTime || '').trim() || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
