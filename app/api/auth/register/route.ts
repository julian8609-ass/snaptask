import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '@/lib/supabase-safe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Email and password are required, and password must be at least 6 characters.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: name || null,
        password_hash: hashedPassword,
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('User creation error:', userError);
      return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }

    // Create user profile
    await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        bio: null,
        theme: 'dark',
        timezone: 'UTC',
        total_xp: 0,
        level: 1,
        streak_days: 0,
      });

    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Unable to register user' }, { status: 500 });
  }
}
