import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_CHAT_MESSAGES = 12;

function buildSystemPrompt() {
  return [
    'You are SnapTask AI, a highly capable general-purpose assistant.',
    'Answer naturally, accurately, and directly to the user’s actual question.',
    'Do not force everything into task advice or productivity talk.',
    'If the user says hello or makes small talk, respond like a real conversational assistant.',
    'If the user asks for code, explain it clearly and give the exact code they asked for.',
    'If the user asks for factual or technical help, answer concisely and clearly.',
    'If the user is vague, ask one short clarifying question instead of guessing.',
    'Use the conversation context and keep the response aligned with the last user message.',
    'When the user requests a name, object, example, or output format, match that format exactly.',
  ].join(' ');
}

function safeEvaluateMathExpression(input: string) {
  const expression = input.replace(/[^0-9+\-*/().\s]/g, '').trim();

  if (!expression || !/^[0-9+\-*/().\s]+$/.test(expression)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function toTitleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : word)
    .join(' ');
}

function buildFallbackReply(messages: ChatMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
  const lowerMessage = (lastUserMessage || '').toLowerCase();
  const mathResult = lastUserMessage ? safeEvaluateMathExpression(lastUserMessage) : null;
  const greetingMatch = /^\s*(hi|hello|hey|yo|sup|good\s+(morning|afternoon|evening))\b/.test(lowerMessage);
  const presenceMatch = /\b(are you there|you there|you alive|can you hear me|respond|hello there|hey there)\b/.test(lowerMessage);
  const codeMatch = /\b(code|javascript|js|snippet|example|tsx|ts|typescript|react|component|interface|type|symbol|symbols|operator|operators)\b/.test(lowerMessage);

  if (!lastUserMessage) {
    return 'Tell me what you want to do and I’ll help you with it.';
  }

  if (mathResult !== null) {
    return String(mathResult);
  }

  if (greetingMatch || presenceMatch) {
    return 'Yes, I’m here. What do you want help with?';
  }

  if (/\b(how are you|who are you|what can you do|help\s+me\s+chat)\b/.test(lowerMessage)) {
    return 'I can chat, answer questions, explain code, and help you with tasks. What do you need?';
  }

  if (codeMatch) {
    const tsxMatch = /\b(tsx|react|component|typescript|interface|type)\b/.test(lowerMessage);
    const nameMatch = lastUserMessage?.match(/(?:show|print|display|write|make|create)\s+(?:the\s+)?name\s+of\s+(.+?)(?:\?|\.|!|$)/i);

    if (/\b(symbol|symbols|operator|operators)\b/.test(lowerMessage)) {
      return `Common code symbols:\n\n+  add\n-  subtract\n*  multiply\n/  divide\n=  assign\n== compare\n=== strict compare\n() function calls\n{} blocks / objects\n[] arrays\n<> JSX tags / generics\n;  end statement\n:  key/value or type annotation`;
    }

    if (tsxMatch && nameMatch?.[1]) {
      const displayName = toTitleCase(nameMatch[1]);
      return `Here’s a simple TSX example:\n\nimport React from 'react';\n\nexport default function NameCard() {\n  return (\n    <main>\n      <h1>{'${displayName}'}</h1>\n    </main>\n  );\n}`;
    }

    if (tsxMatch) {
      return `Here’s a simple TSX example:\n\nimport React from 'react';\n\nexport default function ExampleCard() {\n  return (\n    <main>\n      <h1>Hello from TSX</h1>\n    </main>\n  );\n}`;
    }

    return `Here’s a simple JavaScript example:\n\nconsole.log('Hello, world!');`;
  }

  if (/\b(simple task|easy task|give me a task|give me something to do|task idea)\b/.test(lowerMessage)) {
    return 'Try this: set a 2-minute timer and clear one small area on your desk or phone home screen.';
  }

  if (/\b(what should i do|help me|stuck|need help|next step)\b/.test(lowerMessage)) {
    return 'Pick one tiny win: choose the easiest task on your list and do only the first 2 minutes.';
  }

  if (/\b(plan|schedule|organize)\b/.test(lowerMessage)) {
    return 'Keep it simple: choose one task, set a time, and do the first tiny step now.';
  }

  return `I’m here. For "${lastUserMessage.slice(0, 120)}", tell me a little more and I’ll answer directly.`;
}

function normalizeChatMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_CHAT_MESSAGES);
}

function hasRealOpenAIKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;

  const trimmedKey = key.trim();
  if (!trimmedKey) return false;

  return trimmedKey !== 'your_openai_api_key_here' && trimmedKey !== 'replace_me';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!hasRealOpenAIKey()) {
      return NextResponse.json({
        success: true,
        fallback: true,
        message: buildFallbackReply(messages),
        warning: 'OpenAI API key is missing or still a placeholder. Showing a local fallback reply.',
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemMessage = buildSystemPrompt();
    const chatMessages = normalizeChatMessages(messages);

    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          ...chatMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        max_tokens: 700,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'No response';

      return NextResponse.json({
        success: true,
        message: assistantMessage,
        model: DEFAULT_MODEL,
      });
    } catch (error) {
      const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: number }).status : undefined;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isQuotaOrRateLimit = status === 429 || /quota|rate limit|billing|insufficient/i.test(errorMessage);
      const isAuthError = status === 401 || /api key|authentication|unauthorized|invalid/i.test(errorMessage);

      if (isQuotaOrRateLimit || isAuthError) {
        console.warn('OpenAI unavailable, using fallback reply:', errorMessage);
        return NextResponse.json({
          success: true,
          fallback: true,
          message: buildFallbackReply(messages),
          warning: isAuthError
            ? 'OpenAI authentication failed. Showing a local fallback reply.'
            : 'OpenAI quota or rate limit is exhausted right now. Showing a local fallback reply.',
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get AI response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
