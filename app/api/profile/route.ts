import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-safe';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function computeRank(xp: number) {
  if (xp >= 1500) return 'Master';
  if (xp >= 900) return 'Diamond';
  if (xp >= 500) return 'Gold';
  if (xp >= 250) return 'Silver';
  return 'Bronze';
}

function getSupabase() {
  return getSupabaseClient();
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('Profile API - Received userId:', userId);

    if (!userId) {
      console.error('userId is missing from request');
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get user profile
    console.log('Fetching user_profiles for userId:', userId);
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError.message, profileError.details);
      // Create a default profile if not found
      const defaultProfile = {
        user_id: userId,
        bio: null,
        theme: 'dark',
        timezone: 'UTC',
        total_xp: 0,
        level: 1,
        streak_days: 0,
        rank: 'Bronze',
      };
      
      // Try to insert default profile
      const { data: insertedProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to create default profile:', insertError);
      } else if (insertedProfile) {
        console.log('Created default profile');
        const { data: leaderboardRaw } = await supabase
          .from('user_profiles')
          .select('user_id, total_xp, level, streak_days')
          .order('total_xp', { ascending: false })
          .limit(10);
        
        const leaderboard = [];
        if (leaderboardRaw) {
          for (const entry of leaderboardRaw) {
            const { data: user } = await supabase
              .from('users')
              .select('full_name, email')
              .eq('id', entry.user_id)
              .single();
            
            leaderboard.push({
              id: entry.user_id,
              name: user?.full_name || user?.email || 'Guest',
              xp: entry.total_xp,
              streak: entry.streak_days,
              rank: computeRank(entry.total_xp || 0),
            });
          }
        }
        
        return NextResponse.json({
          profile: { ...insertedProfile, rank: 'Bronze' },
          leaderboard
        });
      }
      
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get leaderboard (top 10 users by XP) with user names
    console.log('Fetching leaderboard');
    const { data: leaderboardRaw, error: leaderboardError } = await supabase
      .from('user_profiles')
      .select('user_id, total_xp, level, streak_days')
      .order('total_xp', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
    }

    // Fetch user names for leaderboard entries
    const leaderboard = [];
    if (leaderboardRaw) {
      for (const entry of leaderboardRaw) {
        const { data: user } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', entry.user_id)
          .single();
        
        leaderboard.push({
          id: entry.user_id,
          name: user?.full_name || user?.email || 'Guest',
          xp: entry.total_xp,
          streak: entry.streak_days,
          rank: computeRank(entry.total_xp || 0),
        });
      }
    }

    const profileWithRank = {
      ...userProfile,
      rank: computeRank(userProfile.total_xp || 0),
    };

    console.log('Successfully fetched profile and leaderboard');
    return NextResponse.json({ profile: profileWithRank, leaderboard: leaderboard || [] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
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

