import { NextRequest, NextResponse } from 'next/server';
import { chatWithAssistant, ChatMessage } from '@/lib/ai/gemini';

export const maxDuration = 60;

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant and get a response with optional task detection
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    // Get AI response with task detection
    const response = await chatWithAssistant(message, history || []);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}