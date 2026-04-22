import { NextRequest, NextResponse } from 'next/server';
import { getReminders } from '@/lib/db/tasks';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'demo-user';

    const reminders = await getReminders(userId);
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Unexpected error in reminders API:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
