import { NextRequest, NextResponse } from 'next/server';
import { detectAndExtractTask, suggestTasksFromGoal, ExtractedTask } from '@/lib/ai/gemini';

export const maxDuration = 60;

/**
 * POST /api/ai/extract-task
 * Extract task details from natural language input
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const extractedTask = await detectAndExtractTask(input);

    return NextResponse.json({
      success: true,
      data: extractedTask,
    });
  } catch (error) {
    console.error('Task extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract task' },
      { status: 500 }
    );
  }
}
