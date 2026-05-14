import { NextRequest, NextResponse } from 'next/server';
import { canUseChatAi, generateSnapTaskChatReply, parseChatRequestAuth } from '@/lib/ai/chat-completion';
import { buildSnapTaskChatSystemPrompt, type ChatPersonaContext } from '@/lib/ai/chat-prompts';
import { parseSuggestedTasksFromAssistantText } from '@/lib/ai/chat-suggested-tasks';
import { getOfflineCodeSampleMarkdown, inferSnapTaskChatIntent } from '@/lib/ai/chat-intent';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_CHAT_MESSAGES = 24;

function buildSystemPrompt(persona?: ChatPersonaContext) {
  return buildSnapTaskChatSystemPrompt(persona);
}

function safeEvaluateMathExpression(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Only evaluate if the *entire* message is arithmetic (no words like "give me 5 tasks")
  if (!/^[0-9+\-*/().\s]+$/.test(trimmed)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${trimmed});`)();
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
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function buildFallbackReply(messages: ChatMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
  const lowerMessage = (lastUserMessage || '').toLowerCase();
  const greetingMatch = /^\s*(hi|hello|hey|yo|sup|good\s+(morning|afternoon|evening))\b/.test(lowerMessage);
  const presenceMatch = /\b(are you there|you there|you alive|can you hear me|respond|hello there|hey there)\b/.test(lowerMessage);

  if (!lastUserMessage) {
    return 'Tell me what you want to do and I’ll help you with it.';
  }

  const offlineIntent = inferSnapTaskChatIntent(lastUserMessage);
  if (offlineIntent.type === 'task_ideas') {
    let n = offlineIntent.count;
    if (n > 20) n = 20;
    const ideas = [
      { title: 'Clear inbox to zero', description: 'Archive or reply to 10 oldest emails.', priority: 'high' as const },
      { title: 'Two-minute tidy', description: 'Reset one visible surface (desk or counter).', priority: 'low' as const },
      { title: 'Walk and think', description: '10-minute walk with one problem in mind.', priority: 'medium' as const },
      { title: 'Plan tomorrow top three', description: 'Write three must-dos for tomorrow on paper.', priority: 'medium' as const },
      { title: 'Prep healthy snack', description: 'Cut fruit or portion nuts for the next work block.', priority: 'low' as const },
      { title: 'Review calendar', description: 'Skim next 48 hours and fix one conflict.', priority: 'high' as const },
      { title: 'Read one doc page', description: 'Finish one section of that doc you keep avoiding.', priority: 'medium' as const },
      { title: 'Stretch break', description: '5 minutes of neck and shoulder stretches.', priority: 'low' as const },
      { title: 'Pay one bill', description: 'Complete a single payment or schedule it.', priority: 'urgent' as const },
      { title: 'Message one person', description: 'Send a short check-in you have been delaying.', priority: 'medium' as const },
    ];
    const tasks = Array.from({ length: n }, (_, i) => {
      const base = ideas[i % ideas.length];
      return {
        title: `${base.title} (#${i + 1})`,
        description: base.description,
        priority: base.priority,
      };
    });
    const md =
      `Here are **${n} starter tasks** (offline mode — connect an AI key in \`.env\` for smarter ideas):\n\n` +
      tasks.map((t, i) => `${i + 1}. **${t.title}** — ${t.description}`).join('\n');
    const json = JSON.stringify({ tasks });
    return `${md}\n\n\`\`\`json\n${json}\n\`\`\``;
  }

  const mathResult = safeEvaluateMathExpression(lastUserMessage);
  if (mathResult !== null) {
    return String(mathResult);
  }

  if (greetingMatch || presenceMatch) {
    return 'Yes, I’m here. What do you want help with?';
  }

  if (/\b(how are you|who are you|what can you do|help\s+me\s+chat)\b/.test(lowerMessage)) {
    return 'I can chat, answer questions, explain code, and help you with tasks. What do you need?';
  }

  if (offlineIntent.type === 'code_help') {
    const tsxMatch = /\b(tsx|react|component|typescript|interface|type)\b/.test(lowerMessage);
    const nameMatch = lastUserMessage?.match(/(?:show|print|display|write|make|create)\s+(?:the\s+)?name\s+of\s+(.+?)(?:\?|\.|!|$)/i);

    if (/\b(symbol|symbols|operator|operators)\b/.test(lowerMessage)) {
      return `Common code symbols:\n\n+  add\n-  subtract\n*  multiply\n/  divide\n=  assign\n== compare\n=== strict compare\n() function calls\n{} blocks / objects\n[] arrays\n<> JSX tags / generics\n;  end statement\n:  key/value or type annotation`;
    }

    if (tsxMatch && nameMatch?.[1]) {
      const displayName = toTitleCase(nameMatch[1]);
      return `Here’s a simple TSX example:\n\n\`\`\`tsx\nimport React from 'react';\n\nexport default function NameCard() {\n  return (\n    <main>\n      <h1>{'${displayName}'}</h1>\n    </main>\n  );\n}\n\`\`\``;
    }

    if (tsxMatch) {
      return `Here’s a simple TSX example:\n\n\`\`\`tsx\nimport React from 'react';\n\nexport default function ExampleCard() {\n  return (\n    <main>\n      <h1>Hello from TSX</h1>\n    </main>\n  );\n}\n\`\`\``;
    }

    const offlineLang = getOfflineCodeSampleMarkdown(lastUserMessage);
    if (offlineLang) {
      return offlineLang;
    }

    return (
      `Say which **language** you want (Python, JavaScript, Bash, …). ` +
      `Here’s a tiny **JavaScript** starter meanwhile:\n\n\`\`\`js\nconsole.log('Hello, SnapTask!');\n\`\`\``
    );
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

function finalizeAssistantPayload(rawMessage: string) {
  const { displayText, tasks } = parseSuggestedTasksFromAssistantText(rawMessage);
  return {
    message: displayText,
    suggestedTasks: tasks.length > 0 ? tasks : undefined,
  };
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

function parsePersonaContext(body: Record<string, unknown>): ChatPersonaContext | undefined {
  const ctx = body.context as Record<string, unknown> | undefined;
  if (!ctx || typeof ctx !== 'object') return undefined;
  const recent = ctx.recentTaskTitles ?? ctx.recentTasks;
  return {
    mood: typeof ctx.mood === 'string' ? ctx.mood : undefined,
    personality: typeof ctx.personality === 'string' ? ctx.personality : undefined,
    rank: typeof ctx.rank === 'string' ? ctx.rank : undefined,
    activeTasks: typeof ctx.activeTasks === 'number' ? ctx.activeTasks : undefined,
    completedTasks: typeof ctx.completedTasks === 'number' ? ctx.completedTasks : undefined,
    recentTaskTitles: Array.isArray(recent) ? recent.map(String) : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages: ChatMessage[];
      context?: Record<string, unknown>;
      apiKey?: string;
      apiProvider?: string;
      apiModel?: string;
    };
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const auth = parseChatRequestAuth(body as Record<string, unknown>);
    const persona = parsePersonaContext(body as Record<string, unknown>);
    const systemMessage = buildSystemPrompt(persona);
    const chatMessages = normalizeChatMessages(messages);

    if (!canUseChatAi(auth)) {
      const raw = buildFallbackReply(chatMessages);
      const finalized = finalizeAssistantPayload(raw);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: finalized.message,
        suggestedTasks: finalized.suggestedTasks,
        warning:
          'No AI API key found. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env, or paste your key in the chat page (Your API key) with the matching provider. Showing a local fallback reply.',
      });
    }

    try {
      const { text, provider, model } = await generateSnapTaskChatReply({
        messages: chatMessages,
        systemPrompt: systemMessage,
        auth,
      });

      const finalized = finalizeAssistantPayload(text || 'No response');

      return NextResponse.json({
        success: true,
        message: finalized.message,
        suggestedTasks: finalized.suggestedTasks,
        provider,
        model,
        usedClientKey: Boolean(auth),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isQuotaOrRateLimit = /429|quota|rate limit|billing|insufficient/i.test(errorMessage);
      const isAuthError = /401|api key|authentication|unauthorized|invalid|403/i.test(errorMessage);

      if (isQuotaOrRateLimit || isAuthError) {
        console.warn('AI provider unavailable, using fallback reply:', errorMessage);
        const raw = buildFallbackReply(chatMessages);
        const finalized = finalizeAssistantPayload(raw);
        return NextResponse.json({
          success: true,
          fallback: true,
          message: finalized.message,
          suggestedTasks: finalized.suggestedTasks,
          warning: isAuthError
            ? 'AI authentication failed. Showing a local fallback reply.'
            : 'AI quota or rate limit hit. Showing a local fallback reply.',
        });
      }

      console.error('Chat AI error:', error);
      const raw = buildFallbackReply(chatMessages);
      const finalized = finalizeAssistantPayload(raw);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: finalized.message,
        suggestedTasks: finalized.suggestedTasks,
        warning: `AI error: ${errorMessage.slice(0, 200)}. Showing a local fallback reply.`,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to get AI response: ${errorMessage}` }, { status: 500 });
  }
}
