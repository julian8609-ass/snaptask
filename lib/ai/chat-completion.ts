import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import {
  appendIntentToSystemPrompt,
  augmentMessagesForModelIntent,
  inferSnapTaskChatIntent,
  type SnapTaskChatIntent,
} from '@/lib/ai/chat-intent';

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatCompletionResult = {
  text: string;
  provider: 'gemini' | 'groq' | 'openai';
  model: string;
};

/** Optional per-request credentials from the client (not stored server-side). */
export type ChatRequestAuth = {
  apiKey: string;
  provider: 'gemini' | 'groq' | 'openai';
  /** Overrides env default model for that provider when set. */
  model?: string;
};

const PLACEHOLDER_KEYS = new Set(['', 'replace_me', 'your_openai_api_key_here', 'your_key', 'changeme']);

/** Normalize env / body values so we never call `.trim()` on undefined. */
function safeTrim(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function isRealKey(value: unknown): boolean {
  const t = safeTrim(value);
  if (!t) return false;
  if (PLACEHOLDER_KEYS.has(t.toLowerCase())) return false;
  return true;
}

export function getGeminiKeyForServer(): string {
  return (
    safeTrim(process.env.GEMINI_API_KEY) ||
    safeTrim(process.env.GOOGLE_API_KEY) ||
    safeTrim(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  );
}

export function getGeminiModelId(): string {
  return safeTrim(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';
}

function hasGroq(): boolean {
  return isRealKey(process.env.GROQ_API_KEY);
}

function hasOpenAI(): boolean {
  return isRealKey(process.env.OPENAI_API_KEY);
}

function hasGemini(): boolean {
  return isRealKey(getGeminiKeyForServer());
}

export type ChatProviderName = 'auto' | 'gemini' | 'groq' | 'openai';

function resolveProviderOrder(requested: ChatProviderName): Array<'gemini' | 'groq' | 'openai'> {
  const r = (requested || 'auto').toLowerCase() as ChatProviderName;
  if (r === 'gemini') {
    if (hasGemini()) return ['gemini'];
    const alt: Array<'gemini' | 'groq' | 'openai'> = [];
    if (hasGroq()) alt.push('groq');
    if (hasOpenAI()) alt.push('openai');
    return alt;
  }
  if (r === 'groq') {
    if (hasGroq()) return ['groq'];
    const alt: Array<'gemini' | 'groq' | 'openai'> = [];
    if (hasGemini()) alt.push('gemini');
    if (hasOpenAI()) alt.push('openai');
    return alt;
  }
  if (r === 'openai') {
    if (hasOpenAI()) return ['openai'];
    const alt: Array<'gemini' | 'groq' | 'openai'> = [];
    if (hasGemini()) alt.push('gemini');
    if (hasGroq()) alt.push('groq');
    return alt;
  }
  const order: Array<'gemini' | 'groq' | 'openai'> = [];
  if (hasGemini()) order.push('gemini');
  if (hasGroq()) order.push('groq');
  if (hasOpenAI()) order.push('openai');
  return order;
}

function resolveOrderForChat(requested: ChatProviderName, auth?: ChatRequestAuth | null): Array<'gemini' | 'groq' | 'openai'> {
  if (auth && isRealKey(auth.apiKey) && (auth.provider === 'gemini' || auth.provider === 'groq' || auth.provider === 'openai')) {
    return [auth.provider];
  }
  return resolveProviderOrder(requested);
}

export function canUseChatAi(auth?: ChatRequestAuth | null): boolean {
  if (auth && isRealKey(auth.apiKey) && (auth.provider === 'gemini' || auth.provider === 'groq' || auth.provider === 'openai')) {
    return true;
  }
  return hasGemini() || hasGroq() || hasOpenAI();
}

function mergeConsecutiveRoles(messages: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    if (last && last.role === m.role) {
      last.content += `\n\n${m.content}`;
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

function chatTemperatureForIntent(intent: SnapTaskChatIntent): number {
  if (intent.type === 'task_ideas') return 0.35;
  if (intent.type === 'follow_up_ack') return 0.45;
  if (intent.type === 'code_help') return 0.4;
  return 0.42;
}

async function completeWithGemini(
  systemPrompt: string,
  messages: ChatTurn[],
  modelId: string,
  intent: SnapTaskChatIntent,
  apiKey: string,
): Promise<string> {
  const key = safeTrim(apiKey);
  if (!key) {
    throw new Error('Missing Gemini API key');
  }
  const genAI = new GoogleGenerativeAI(key);
  const temperature = chatTemperatureForIntent(intent);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      topP: 0.9,
      topK: 40,
    },
  });

  let normalized = mergeConsecutiveRoles(messages.filter((m) => m.content?.trim()));
  while (normalized.length > 0 && normalized[0].role === 'assistant') {
    normalized = normalized.slice(1);
  }
  if (normalized.length === 0) return '';

  const last = normalized[normalized.length - 1];
  if (last.role !== 'user') {
    normalized = [...normalized, { role: 'user', content: 'Continue.' }];
  }

  const history = [];
  for (let i = 0; i < normalized.length - 1; i++) {
    const m = normalized[i];
    history.push({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    });
  }

  const lastUser = normalized[normalized.length - 1].content;
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastUser);
  return result.response.text() || '';
}

async function completeWithGroq(
  systemPrompt: string,
  messages: ChatTurn[],
  modelId: string,
  intent: SnapTaskChatIntent,
  apiKey: string,
): Promise<string> {
  const key = safeTrim(apiKey);
  if (!key) {
    throw new Error('Missing Groq API key');
  }
  const body = {
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    temperature: chatTemperatureForIntent(intent),
    top_p: 0.9,
    max_tokens: 4096,
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content || '';
}

async function completeWithOpenAI(
  systemPrompt: string,
  messages: ChatTurn[],
  modelId: string,
  intent: SnapTaskChatIntent,
  apiKey: string,
): Promise<string> {
  const key = safeTrim(apiKey);
  if (!key) {
    throw new Error('Missing OpenAI API key');
  }
  const client = new OpenAI({ apiKey: key });
  const response = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    max_tokens: 4096,
    temperature: chatTemperatureForIntent(intent),
    top_p: 0.9,
  });
  return response.choices[0]?.message?.content || '';
}

/**
 * Returns a reply using the first available provider in AI_CHAT_PROVIDER order.
 * Throws if all configured providers fail (caller may fall back to local heuristics).
 */
export async function generateSnapTaskChatReply(options: {
  messages: ChatTurn[];
  systemPrompt: string;
  /** When set, this key (and provider) are used for the request instead of server env keys. */
  auth?: ChatRequestAuth | null;
}): Promise<ChatCompletionResult> {
  const { messages, systemPrompt, auth } = options;
  const lastUserText = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const intent = inferSnapTaskChatIntent(lastUserText);
  const effectiveSystem = appendIntentToSystemPrompt(systemPrompt, intent);
  const effectiveMessages = augmentMessagesForModelIntent(messages, intent);

  const requested = (safeTrim(process.env.AI_CHAT_PROVIDER).toLowerCase() || 'auto') as ChatProviderName;
  const order = resolveOrderForChat(requested, auth ?? null);

  if (order.length === 0) {
    throw new Error('No AI provider configured (set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY).');
  }

  const envGeminiModel = getGeminiModelId();
  const envGroqModel = safeTrim(process.env.GROQ_CHAT_MODEL) || 'llama-3.3-70b-versatile';
  const envOpenaiModel = safeTrim(process.env.OPENAI_CHAT_MODEL) || 'gpt-4o-mini';

  const geminiModel =
    auth?.provider === 'gemini' && safeTrim(auth.model) ? safeTrim(auth.model) : envGeminiModel;
  const groqModel = auth?.provider === 'groq' && safeTrim(auth.model) ? safeTrim(auth.model) : envGroqModel;
  const openaiModel = auth?.provider === 'openai' && safeTrim(auth.model) ? safeTrim(auth.model) : envOpenaiModel;

  const geminiKey =
    auth?.provider === 'gemini' && isRealKey(auth.apiKey) ? safeTrim(auth.apiKey) : getGeminiKeyForServer();
  const groqKey =
    auth?.provider === 'groq' && isRealKey(auth.apiKey) ? safeTrim(auth.apiKey) : safeTrim(process.env.GROQ_API_KEY);
  const openaiKey =
    auth?.provider === 'openai' && isRealKey(auth.apiKey) ? safeTrim(auth.apiKey) : safeTrim(process.env.OPENAI_API_KEY);

  const errors: string[] = [];

  for (const provider of order) {
    try {
      if (provider === 'gemini') {
        if (!isRealKey(geminiKey)) {
          errors.push('gemini: missing API key');
          continue;
        }
        const text = await completeWithGemini(effectiveSystem, effectiveMessages, geminiModel, intent, geminiKey);
        return { text, provider: 'gemini', model: geminiModel };
      }
      if (provider === 'groq') {
        if (!isRealKey(groqKey)) {
          errors.push('groq: missing API key');
          continue;
        }
        const text = await completeWithGroq(effectiveSystem, effectiveMessages, groqModel, intent, groqKey);
        return { text, provider: 'groq', model: groqModel };
      }
      if (provider === 'openai') {
        if (!isRealKey(openaiKey)) {
          errors.push('openai: missing API key');
          continue;
        }
        const text = await completeWithOpenAI(effectiveSystem, effectiveMessages, openaiModel, intent, openaiKey);
        return { text, provider: 'openai', model: openaiModel };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${provider}: ${msg}`);
      console.warn(`[chat-completion] ${provider} failed, trying next:`, msg);
    }
  }

  throw new Error(errors.join(' | ') || 'All providers failed.');
}

export function anyChatProviderConfigured(): boolean {
  return hasGemini() || hasGroq() || hasOpenAI();
}

/** Parses optional client-supplied chat credentials from the API body. */
export function parseChatRequestAuth(body: Record<string, unknown>): ChatRequestAuth | null {
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const providerRaw = typeof body.apiProvider === 'string' ? body.apiProvider.trim().toLowerCase() : '';
  const model = typeof body.apiModel === 'string' ? body.apiModel.trim() : '';
  if (!isRealKey(apiKey)) return null;
  if (providerRaw !== 'gemini' && providerRaw !== 'groq' && providerRaw !== 'openai') return null;
  return {
    apiKey,
    provider: providerRaw,
    model: model || undefined,
  };
}
