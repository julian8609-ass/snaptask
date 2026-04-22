import { NextRequest, NextResponse } from 'next/server';
import { generateTaskSuggestions, analyzeTask } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, input } = body;

    if (type === 'suggest') {
      const suggestions = await generateTaskSuggestions(input);
      return NextResponse.json({ suggestions });
    }

    if (type === 'analyze') {
      const { title, description } = body;
      const analysis = await analyzeTask(title, description);
      return NextResponse.json(analysis);
    }

    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
