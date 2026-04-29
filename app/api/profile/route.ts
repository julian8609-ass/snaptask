import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function computeRank(xp: number) {
  if (xp >= 1500) return 'Master';
  if (xp >= 900) return 'Diamond';
  if (xp >= 500) return 'Gold';
  if (xp >= 250) return 'Silver';
  return 'Bronze';
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get leaderboard (top 10 users by XP)
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('user_profiles')
      .select('user_id, total_xp, level, streak_days')
      .order('total_xp', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
    }

    const profileWithRank = {
      ...userProfile,
      rank: computeRank(userProfile.total_xp || 0),
    };

    return NextResponse.json({ profile: profileWithRank, leaderboard: leaderboard || [] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bio, theme, timezone } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        bio: bio || null,
        theme: theme || 'dark',
        timezone: timezone || 'UTC',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile?.[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
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
