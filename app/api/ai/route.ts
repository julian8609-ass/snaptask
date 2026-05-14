import { NextResponse } from 'next/server';
import { anyChatProviderConfigured, generateSnapTaskChatReply } from '@/lib/ai/chat-completion';
import { buildSnapTaskChatSystemPrompt } from '@/lib/ai/chat-prompts';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatContext = {
  mood?: string;
  personality?: string;
  rank?: string;
  energy?: number;
  activeTasks?: number;
  completedTasks?: number;
  recentTasks?: string[];
};

const personalityPrompts: Record<string, string> = {
  calm_mentor: 'You are a calm mentor, gentle and supportive in your tone.',
  strict_coach: 'You are a strict coach, direct and motivating with a strong but fair tone.',
  funny_friend: 'You are a funny friend, playful and upbeat while still being helpful.',
};

const fallbackSuggestions: Record<
  string,
  Record<string, Array<{ title: string; description?: string; difficulty: 'easy' | 'medium' | 'hard'; energy: number; suggestedTime?: string }>>
> = {
  tired: {
    calm_mentor: [
      { title: '🎨 Draw a cozy evening scene', description: 'Create a 10-minute sketch of your ideal cozy space to relax', difficulty: 'easy', energy: 1, suggestedTime: '19:30' },
      { title: '🍵 Mindful tea ritual', description: 'Brew calming tea and journal one thing that brought you joy today', difficulty: 'easy', energy: 1, suggestedTime: '20:00' },
      { title: '🧘 Gentle stretching session', description: 'Spend five minutes stretching different body parts while breathing deeply', difficulty: 'easy', energy: 1, suggestedTime: '19:00' },
      { title: '✍️ Gratitude meditation', description: 'Write three things you are grateful for and reflect on them', difficulty: 'easy', energy: 1, suggestedTime: '20:30' },
      { title: '🎵 Mood-lifting playlist', description: 'Listen to one uplifting song and notice how your body responds', difficulty: 'easy', energy: 1, suggestedTime: '19:15' },
    ],
    strict_coach: [
      { title: '⚡ Quick win sprint', description: 'Identify and complete one small task to build momentum', difficulty: 'easy', energy: 1, suggestedTime: '18:00' },
      { title: '🧹 Single surface reset', description: 'Quickly organize one desk or shelf area and feel the difference', difficulty: 'easy', energy: 1, suggestedTime: '18:30' },
      { title: '📋 Tomorrow planning', description: 'Bullet point your top three priorities for tomorrow', difficulty: 'easy', energy: 1, suggestedTime: '20:00' },
      { title: '💬 Important message check', description: 'Reply to one message you have been putting off', difficulty: 'easy', energy: 1, suggestedTime: '17:30' },
      { title: '🎯 Tiny task completion', description: 'Find the easiest thing on your list and finish it now', difficulty: 'easy', energy: 1, suggestedTime: '18:15' },
    ],
    funny_friend: [
      { title: '🎨 Musical doodle session', description: 'Sketch random shapes while listening to your favorite upbeat song', difficulty: 'easy', energy: 1, suggestedTime: '19:45' },
      { title: '📱 Silly emoji story', description: 'Create a short story using only emojis and send it to yourself', difficulty: 'easy', energy: 1, suggestedTime: '19:30' },
      { title: '💃 Mini dance party', description: 'Have a 2-minute dance break like nobody is watching', difficulty: 'easy', energy: 1, suggestedTime: '18:45' },
      { title: '🛋️ Cozy code moment', description: 'Get comfortable and call it your official productivity ritual', difficulty: 'easy', energy: 1, suggestedTime: '20:00' },
      { title: '🎭 Eyes-closed storytelling', description: 'Write a silly one-liner story without peeking at what you wrote', difficulty: 'easy', energy: 1, suggestedTime: '19:15' },
    ],
  },
  focused: {
    calm_mentor: [
      { title: '📰 Personal headline creation', description: 'Craft an inspiring headline that captures your purpose for today', difficulty: 'medium', energy: 2, suggestedTime: '09:00' },
      { title: '💡 Brainstorm & capture', description: 'Spend 10 minutes writing down all your ideas without judgment', difficulty: 'medium', energy: 2, suggestedTime: '10:00' },
      { title: '🎯 Micro-challenge sprint', description: 'Complete one small focused task from your backlog', difficulty: 'medium', energy: 2, suggestedTime: '14:00' },
      { title: '👀 Goal review ritual', description: 'Take three minutes to review your three main goals for today', difficulty: 'easy', energy: 1, suggestedTime: '08:30' },
      { title: '🌟 Progress checkpoint', description: 'Pause and write down one meaningful thing you accomplished', difficulty: 'easy', energy: 1, suggestedTime: '15:00' },
    ],
    strict_coach: [
      { title: '💪 Avoidance buster challenge', description: 'Identify the task you have been dodging and tackle it head-on', difficulty: 'hard', energy: 3, suggestedTime: '10:00' },
      { title: '⏱️ Deep focus pomodoro', description: 'Block 25 minutes with zero distractions and no breaks', difficulty: 'hard', energy: 3, suggestedTime: '11:00' },
      { title: '🚀 Urgent priority smash', description: 'Complete one time-sensitive item on your priority list', difficulty: 'hard', energy: 3, suggestedTime: '13:00' },
      { title: '📌 Morning priority wrap', description: 'Finish one major task before lunch to build confidence', difficulty: 'medium', energy: 2, suggestedTime: '12:00' },
      { title: '✅ Momentum builder', description: 'Push one critical project across the finish line', difficulty: 'hard', energy: 3, suggestedTime: '15:00' },
    ],
    funny_friend: [
      { title: '🎮 Gamify your task', description: 'Add points and rewards to your next task to make it fun', difficulty: 'medium', energy: 2, suggestedTime: '11:00' },
      { title: '🎉 Victory lap dance', description: 'Finish one task and celebrate with your own silly victory sound', difficulty: 'medium', energy: 2, suggestedTime: '14:00' },
      { title: '📖 Flash fiction sprint', description: 'Write a quick 3-line story about crushing your to-do list today', difficulty: 'medium', energy: 2, suggestedTime: '10:30' },
      { title: '⚡ Creative energy blast', description: 'Set a timer for 20 minutes and work on your most creative task', difficulty: 'medium', energy: 2, suggestedTime: '13:00' },
      { title: '🙌 Self high-five moment', description: 'Acknowledge one win you had (no matter how small)', difficulty: 'easy', energy: 1, suggestedTime: '16:00' },
    ],
  },
  lazy: {
    calm_mentor: [
      { title: '📅 Gentle tomorrow plan', description: 'Create a simple three-item plan for tomorrow when you have energy', difficulty: 'easy', energy: 1, suggestedTime: '20:00' },
      { title: '⭐ One tiny victory', description: 'Write down one small win you can actually accomplish today', difficulty: 'easy', energy: 1, suggestedTime: '18:00' },
      { title: '✋ The easiest win', description: 'Pick the easiest item within reach and complete it', difficulty: 'easy', energy: 1, suggestedTime: '15:00' },
      { title: '📖 Inspiration pause', description: 'Read one uplifting quote and let it sit with you', difficulty: 'easy', energy: 1, suggestedTime: '19:00' },
      { title: '😊 Kind moment to self', description: 'Tell yourself one genuine compliment out loud', difficulty: 'easy', energy: 1, suggestedTime: '17:00' },
    ],
    strict_coach: [
      { title: '⚡ Immediate action', description: 'Stop procrastinating and complete one task right now', difficulty: 'easy', energy: 1, suggestedTime: '14:00' },
      { title: '🎯 Priority statement', description: 'Write one clear statement of what matters most today', difficulty: 'easy', energy: 1, suggestedTime: '09:00' },
      { title: '✅ Later to done', description: 'Take one postponed task and finish it today', difficulty: 'easy', energy: 1, suggestedTime: '16:00' },
      { title: '🏁 Finish line focus', description: 'Complete one task completely, no half-measures', difficulty: 'easy', energy: 1, suggestedTime: '17:00' },
      { title: '💪 Low-effort execution', description: 'Pick your easiest task and execute it flawlessly', difficulty: 'easy', energy: 1, suggestedTime: '15:00' },
    ],
    funny_friend: [
      { title: '🤣 Silly daily story', description: 'Write a hilarious one-sentence description of your day so far', difficulty: 'easy', energy: 1, suggestedTime: '18:00' },
      { title: '💃 Chair dance party', description: 'Do a three-minute dance challenge right from your seat', difficulty: 'easy', energy: 1, suggestedTime: '17:30' },
      { title: '🎉 Fun task selection', description: 'Pick the most enjoyable thing on your list and do it', difficulty: 'easy', energy: 1, suggestedTime: '16:00' },
      { title: '🎁 Goofy reward design', description: 'Create a silly reward system for your next completed task', difficulty: 'easy', energy: 1, suggestedTime: '19:00' },
      { title: '😄 Self compliment time', description: 'Give yourself one genuine, goofy compliment out loud', difficulty: 'easy', energy: 1, suggestedTime: '17:00' },
    ],
  },
  productive: {
    calm_mentor: [
      { title: '🎯 Bold hourly intent', description: 'Set one clear, ambitious goal for the next 60 minutes', difficulty: 'hard', energy: 3, suggestedTime: '10:00' },
      { title: '💭 Creative outline sprint', description: 'Spend 15 minutes outlining your next big creative project', difficulty: 'medium', energy: 2, suggestedTime: '11:00' },
      { title: '⚡ Power action moment', description: 'Execute one significant task that moves you forward', difficulty: 'hard', energy: 3, suggestedTime: '13:00' },
      { title: '🚀 Stretch goal planning', description: 'Design one ambitious but achievable goal for this month', difficulty: 'medium', energy: 2, suggestedTime: '09:30' },
      { title: '✨ Morning achievement', description: 'Accomplish one meaningful task before lunch', difficulty: 'hard', energy: 3, suggestedTime: '12:00' },
    ],
    strict_coach: [
      { title: '💥 Task crushing sprint', description: 'Annihilate one ambitious task and own the victory', difficulty: 'hard', energy: 3, suggestedTime: '11:00' },
      { title: '🔥 Highest priority first', description: 'Tackle the most critical item on your entire list immediately', difficulty: 'hard', energy: 3, suggestedTime: '09:00' },
      { title: '🏆 Finish line push', description: 'Push one major project to completion without stopping', difficulty: 'hard', energy: 3, suggestedTime: '14:00' },
      { title: '🎯 Clear win recipe', description: 'Define one specific victory and execute it flawlessly', difficulty: 'medium', energy: 2, suggestedTime: '10:30' },
      { title: '⚔️ Strong finish challenge', description: 'End the day with a powerful accomplishment that matters', difficulty: 'hard', energy: 3, suggestedTime: '17:00' },
    ],
    funny_friend: [
      { title: '🥷 Productivity ninja assault', description: 'Complete one task with precision and stealth-like efficiency', difficulty: 'hard', energy: 3, suggestedTime: '12:00' },
      { title: '💫 Power move spectacular', description: 'Punch through your biggest blocker with dramatic flair', difficulty: 'hard', energy: 3, suggestedTime: '13:00' },
      { title: '🏅 Victory headline composer', description: 'Write a hilarious headline about your next win for the news', difficulty: 'medium', energy: 2, suggestedTime: '15:00' },
      { title: '👊 Bold action high-five', description: 'Take one big swing at a task and celebrate yourself hard', difficulty: 'medium', energy: 2, suggestedTime: '14:30' },
      { title: '🎊 Epic completion party', description: 'Finish something big and throw yourself an imaginary party', difficulty: 'hard', energy: 3, suggestedTime: '16:00' },
    ],
  },
};

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getRandomSuggestions<T>(items: T[]) {
  return shuffleArray(items).slice(0, Math.min(items.length, 5));
}

function getFallbackChatReply(mood: string, personality: string, lastMessage: string, context: ChatContext) {
  const shortReply = lastMessage.trim().slice(0, 120) || 'that request';
  const lowerMessage = lastMessage.toLowerCase();
  const recentTask = context.recentTasks?.[0];
  const taskHint = recentTask ? ` Your closest task is “${recentTask}.”` : '';

  if (lowerMessage.includes('tiny step') || lowerMessage.includes('next step')) {
    return `Make the next step smaller than you think: spend 2 minutes opening the task, writing the first line, or sending the first message.${taskHint} Want me to turn it into a 3-step micro plan?`;
  }

  if (lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
    return `Let’s make it concrete: I can help you turn ${shortReply} into a simple plan with one action, one time, and one finish line.${taskHint} If you want, I’ll do that now.`;
  }

  if (lowerMessage.includes('what should i do') || lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
    return `Start with the easiest honest win: choose one task, make it smaller, and do the first 2 minutes only.${taskHint} If you want, I can pick the best one for you.`;
  }

  if (personality === 'strict_coach') {
    return `Got it. For ${shortReply}, do the smallest version now and stop overthinking it.${taskHint} If you want, I can turn it into a 3-step plan.`;
  }

  if (personality === 'funny_friend') {
    return `Absolutely. ${shortReply} sounds like a mission. I’m in.${taskHint} Want me to turn it into a goofy plan, a tiny next step, or a full task list?`;
  }

  return `I hear you. For ${shortReply}, we can keep it simple and make one clear next move.${taskHint} If you want, I can break it down, schedule it, or make it easier.`;
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('OPENAI_API_KEY is not set.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You provide short fun task suggestions and reflections in JSON format.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) {
      console.error('No content in OpenAI API response:', json);
      return null;
    }

    const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type || 'suggest');

    if (type === 'chat') {
      const mood = String(body.mood || 'focused');
      const personality = String(body.personality || 'calm_mentor');
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const context: ChatContext = {
        mood,
        personality,
        rank: String(body.context?.rank || 'Bronze'),
        energy: Number(body.context?.energy || 0),
        activeTasks: Number(body.context?.activeTasks || 0),
        completedTasks: Number(body.context?.completedTasks || 0),
        recentTasks: Array.isArray(body.context?.recentTasks) ? body.context.recentTasks : [],
      };
      const lastUserMessage = [...rawMessages].reverse().find((message) => message.role === 'user')?.content || '';

      const chatTurns = rawMessages
        .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
        .map((m: ChatMessage) => ({ role: m.role as 'user' | 'assistant', content: String(m.content || '').trim() }))
        .filter((m: { role: 'user' | 'assistant'; content: string }) => m.content.length > 0)
        .slice(-12);

      if (!anyChatProviderConfigured()) {
        return NextResponse.json({ response: getFallbackChatReply(mood, personality, lastUserMessage, context) });
      }

      const systemPrompt = buildSnapTaskChatSystemPrompt({
        mood,
        personality,
        rank: context.rank,
        activeTasks: context.activeTasks,
        completedTasks: context.completedTasks,
        recentTaskTitles: context.recentTasks?.map(String),
      });

      try {
        const { text } = await generateSnapTaskChatReply({
          messages: chatTurns,
          systemPrompt,
        });
        if (!text?.trim()) {
          return NextResponse.json({ response: getFallbackChatReply(mood, personality, lastUserMessage, context) });
        }
        return NextResponse.json({ response: text });
      } catch (e) {
        console.warn('/api/ai chat provider error:', e);
        return NextResponse.json({ response: getFallbackChatReply(mood, personality, lastUserMessage, context) });
      }
    }

    const mood = String(body.mood || 'focused');
    const personality = String(body.personality || 'calm_mentor');
    const energy = Number(body.energy || 3);
    const safePersonality = personalityPrompts[personality] ? personality : 'calm_mentor';
    const fallback = fallbackSuggestions[mood]?.[safePersonality] || fallbackSuggestions.focused.calm_mentor;
    const message = `Here are fun suggestions for your ${mood} mood from your ${safePersonality.replace(/_/g, ' ')} companion.`;
    const randomFallback = getRandomSuggestions(fallback);

    if (!process.env.OPENAI_API_KEY) {
      console.warn('Using fallback suggestions because OPENAI_API_KEY is not set.');
      return NextResponse.json({ suggestions: randomFallback, message });
    }

    const prompt = `${personalityPrompts[safePersonality]} Suggest 5 fun tasks for someone who feels ${mood} and has energy level ${energy}. Return valid JSON containing a suggestions array. Each suggestion should include title, difficulty, and energy.`;
    const result = await callOpenAI(prompt);
    if (result?.suggestions) {
      return NextResponse.json({ suggestions: getRandomSuggestions(result.suggestions), message: result.message || message });
    }

    console.warn('OpenAI API did not return suggestions. Using fallback suggestions.');
    return NextResponse.json({ suggestions: randomFallback, message: `Could not reach AI; returning fallback tasks for ${mood}.` });
  } catch (error) {
    console.error('Error in AI suggestions API:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate AI suggestions' }), { status: 500 });
  }
}
