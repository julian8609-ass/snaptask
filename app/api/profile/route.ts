import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function computeRank(xp: number) {
  if (xp >= 1500) return 'Master';
  if (xp >= 900) return 'Diamond';
  if (xp >= 500) return 'Gold';
  if (xp >= 250) return 'Silver';
  return 'Bronze';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const leaderboard = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        xp: true,
        streak: true,
      },
    });

    const profileWithRank = {
      ...userProfile,
      rank: computeRank(userProfile.xp),
    };

    return NextResponse.json({ profile: profileWithRank, leaderboard });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const mood = body.mood;
    const personality = body.personality;
    const allowedMood = ['tired', 'focused', 'lazy', 'productive'];
    const allowedPersonality = ['calm_mentor', 'strict_coach', 'funny_friend'];

    const data: { mood?: string; personality?: string } = {};
    if (allowedMood.includes(mood)) data.mood = mood;
    if (allowedPersonality.includes(personality)) data.personality = personality;

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data,
    });

    return NextResponse.json({ profile: user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
