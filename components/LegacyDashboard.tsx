'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskCalendar } from '@/components/TaskCalendar';

type Difficulty = 'easy' | 'medium' | 'hard';

type DashboardTask = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: Difficulty;
  energy: number;
  xp: number;
  source: 'USER' | 'AI';
  status: 'todo' | 'completed';
  skipCount: number;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};

type SuggestionCard = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  energy: number;
  time: string;
  emoji: string;
};

const difficultyOptions: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: 'Easy - 1 energy' },
  { value: 'medium', label: 'Medium - 2 energy' },
  { value: 'hard', label: 'Hard - 3 energy' },
];

const energyByDifficulty: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const defaultSuggestions: SuggestionCard[] = [
  {
    id: 'default-1',
    title: 'Bold action high-five',
    description: 'Take one big swing at a task and celebrate yourself hard',
    difficulty: 'medium',
    energy: 2,
    time: '14:30',
    emoji: '👊',
  },
  {
    id: 'default-2',
    title: 'Victory headline composer',
    description: 'Write a hilarious headline about your next win for the news',
    difficulty: 'medium',
    energy: 2,
    time: '15:00',
    emoji: '🏅',
  },
  {
    id: 'default-3',
    title: 'Epic completion party',
    description: 'Finish something big and throw yourself an imaginary party',
    difficulty: 'hard',
    energy: 3,
    time: '16:00',
    emoji: '🎊',
  },
  {
    id: 'default-4',
    title: 'Power move spectacular',
    description: 'Pick a noisy, obvious win and move it across the line now',
    difficulty: 'easy',
    energy: 1,
    time: '16:30',
    emoji: '⚡',
  },
];

type LeaderboardEntry = {
  id: string;
  name: string | null;
  xp: number;
  streak: number;
  rank: string;
};

type ProfileData = {
  name: string | null;
  email: string;
  xp: number;
  rank: string;
  streak: number;
  mood: string;
  personality: string;
  energy: number;
  completedTasks: number;
  pendingTasks: number;
  aiTasks: number;
  userTasks: number;
};

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

function sortTasks(tasks: DashboardTask[]) {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'completed' ? 1 : -1;
    }

    const leftDate = new Date(left.scheduledDate || left.id).getTime();
    const rightDate = new Date(right.scheduledDate || right.id).getTime();
    if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) {
      return 0;
    }

    if (Number.isNaN(leftDate)) {
      return 1;
    }

    if (Number.isNaN(rightDate)) {
      return -1;
    }

    return rightDate - leftDate;
  });
}

export function LegacyDashboard() {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'I\'m here with you. Tell me what you want to work through, and I\'ll talk it out with you.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const activeCount = useMemo(() => tasks.filter((task) => task.status !== 'completed').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((task) => task.status === 'completed').length, [tasks]);

  const loadTasks = async () => {
    setLoadingTasks(true);
    setTaskError(null);

    try {
      const response = await fetch('/api/tasks', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Sign in to load your tasks.' : 'Failed to load tasks.');
      }

      const data = (await response.json()) as DashboardTask[];
      setTasks(sortTasks(data));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Failed to load tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadProfile = async () => {
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Sign in to load your profile.' : 'Failed to load profile.');
      }

      const data = (await response.json()) as { profile?: ProfileData; leaderboard?: LeaderboardEntry[]; error?: string };
      if (data.error) {
        throw new Error(data.error);
      }

      setProfile(data.profile ?? null);
      setLeaderboard(data.leaderboard ?? []);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    void loadTasks();
    void loadProfile();
  }, []);

  const rank = profile?.rank ?? 'Bronze';
  const xp = profile?.xp ?? 0;

  const createTask = async (taskPayload: {
    title: string;
    description?: string;
    difficulty: Difficulty;
    scheduledDate?: string;
    scheduledTime?: string;
    source?: 'AI' | 'USER';
  }) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: taskPayload.title,
        description: taskPayload.description,
        difficulty: taskPayload.difficulty,
        energy: energyByDifficulty[taskPayload.difficulty],
        source: taskPayload.source || 'USER',
        scheduledDate: taskPayload.scheduledDate,
        scheduledTime: taskPayload.scheduledTime,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create task.');
    }

    const created = (await response.json()) as DashboardTask;
    setTasks((current) => sortTasks([created, ...current]));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setTaskError(null);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        source: 'USER',
      });

      setTitle('');
      setDescription('');
      setDifficulty('easy');
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Failed to create task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendChat = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const message = chatInput.trim();
    if (!message || isChatting) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError(null);
    setIsChatting(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          mood: profile?.mood || 'focused',
          personality: profile?.personality || 'calm_mentor',
          messages: nextMessages,
          context: {
            rank: profile?.rank || rank,
            energy: profile?.energy ?? 0,
            activeTasks: activeCount,
            completedTasks: completedCount,
            recentTasks: tasks.slice(0, 3).map((task) => task.title),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response.');
      }

      const data = (await response.json()) as { response?: string; error?: string };
      if (!data.response) {
        throw new Error(data.error || 'Failed to get AI response.');
      }

      setChatMessages((current) => [...current, { role: 'assistant', content: data.response as string }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to get AI response.');
      setChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I hit a snag replying just now, but I\'m still here. Try asking again in a simpler way.',
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'completed' }),
    });

    await loadTasks();
  };

  const handleSkip = async (taskId: string, currentSkipCount: number) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ skipCount: currentSkipCount + 1 }),
    });

    await loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    await loadTasks();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.12),_transparent_24%),linear-gradient(180deg,_#080808_0%,_#000000_100%)] px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-[1.55fr_0.95fr]">
          <section className="rounded-[34px] border border-orange-500/15 bg-[#050505]/95 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">Dashboard</p>
                <p className="mt-2 text-sm text-slate-300">AI-created and user tasks live together here.</p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-white/5 bg-white/5 p-1 text-sm text-slate-100 shadow-inner shadow-black/20">
                <span className="rounded-full bg-[#171717] px-4 py-2 font-medium text-slate-200">{activeCount} active</span>
                <span className="rounded-full bg-[#171717] px-4 py-2 font-medium text-slate-200">{completedCount} completed</span>
              </div>
            </header>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[26px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Rank</p>
                <p className="mt-3 text-2xl font-semibold text-white">{loadingProfile ? '...' : rank}</p>
                <p className="mt-1 text-sm text-slate-300">{xp} XP earned</p>
              </div>
              <div className="rounded-[26px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Streak</p>
                <p className="mt-3 text-2xl font-semibold text-white">{loadingProfile ? '...' : (profile?.streak ?? 0)}</p>
                <p className="mt-1 text-sm text-slate-300">Daily momentum count</p>
              </div>
              <div className="rounded-[26px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mood</p>
                <p className="mt-3 text-2xl font-semibold text-white">{loadingProfile ? '...' : (profile?.mood ?? 'focused')}</p>
                <p className="mt-1 text-sm text-slate-300">Current profile mood</p>
              </div>
              <div className="rounded-[26px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Energy</p>
                <p className="mt-3 text-2xl font-semibold text-white">{loadingProfile ? '...' : (profile?.energy ?? 0)}</p>
                <p className="mt-1 text-sm text-slate-300">Available today</p>
              </div>
            </div>

            {profileError && (
              <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {profileError}
              </p>
            )}

            <nav className="mt-5 flex flex-wrap gap-2">
              <Link href="/profile" className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20">
                Profile
              </Link>
              <Link href="/tasks" className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20">
                Tasks
              </Link>
              <Link href="/daily-reflection" className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20">
                Daily Reflection
              </Link>
              <Link href="/events" className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20">
                Events
              </Link>
            </nav>

            <form className="mt-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  Task title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Write a fun task title"
                    className="h-12 rounded-2xl border border-white/8 bg-[#040816] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400/70"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  Difficulty
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                    className="h-12 rounded-2xl border border-white/8 bg-[#040816] px-4 text-slate-100 outline-none transition focus:border-orange-400/70"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="md:col-span-2 h-11 rounded-full bg-orange-500 px-7 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Adding...' : 'Add task'}
                </button>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-200">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional note for your task"
                  rows={5}
                  className="min-h-[128px] rounded-[24px] border border-white/8 bg-[#040816] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400/70"
                />
              </label>

              {taskError && (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {taskError}
                </p>
              )}
            </form>
          </section>

          <section className="rounded-[34px] border border-orange-500/15 bg-[#050505]/95 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
            <header>
              <p className="text-[2rem] font-semibold tracking-tight text-white">AI conversation</p>
              <p className="mt-3 text-sm text-slate-300">Talk to your AI like a real conversation and get a reply right away.</p>
            </header>

            <form className="mt-6" onSubmit={handleSendChat}>
              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[24px] border border-white/8 bg-[#08111d] p-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'bg-orange-400 text-slate-950'
                          : 'border border-white/8 bg-white/5 text-slate-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isChatting && (
                  <div className="flex justify-start">
                    <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-200">
                Your message
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  rows={4}
                  placeholder="Ask me anything about your tasks, mood, or what to do next..."
                  className="mt-2 w-full rounded-[22px] border border-white/10 bg-[#1b1b1b] px-4 py-3 text-slate-100 outline-none placeholder:text-slate-300 focus:border-orange-400/70"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isChatting || !chatInput.trim()}
                  className="rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChatting ? 'Thinking...' : 'Send message'}
                </button>

                <button
                  type="button"
                  onClick={() => setChatMessages([
                    {
                      role: 'assistant',
                      content: 'I\'m here with you. Tell me what you want to work through, and I\'ll talk it out with you.',
                    },
                  ])}
                  className="rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Reset chat
                </button>
              </div>
            </form>

            {chatError && (
              <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {chatError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {defaultSuggestions.slice(0, 4).map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => setChatInput(`Help me with ${starter.title.toLowerCase()}: ${starter.description}`)}
                  className="rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/20"
                >
                  {starter.title}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[34px] border border-orange-500/15 bg-[#0f0f0f]/90 p-5 shadow-[0_24px_55px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6">
            <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
            {loadingProfile ? (
              <p className="mt-4 text-sm text-slate-300">Loading leaderboard...</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">No leaderboard data yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{index + 1}. {entry.name ?? 'Guest'}</p>
                        <p className="text-sm text-slate-300">{entry.rank}</p>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <p className="text-white">{entry.xp} XP</p>
                        <p>{entry.streak} streak</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[34px] border border-orange-500/15 bg-[#0f0f0f]/90 p-5 shadow-[0_24px_55px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6">
            <h2 className="text-xl font-semibold text-white">Calendar</h2>
            <p className="mt-1 text-sm text-slate-300">Scheduled tasks by day.</p>
            <div className="mt-4 rounded-[24px] border border-white/8 bg-[#06111a] p-4">
              <TaskCalendar tasks={tasks} />
            </div>
          </article>
        </section>

        <section className="rounded-[34px] border border-orange-500/15 bg-[#0f0f0f]/90 p-5 shadow-[0_24px_55px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6">
          {loadingTasks ? (
            <p className="text-sm text-slate-300">Loading your tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-200">
              <p className="font-semibold">No tasks yet.</p>
              <p className="mt-1 text-sm text-slate-300">Create one on the left or add a suggestion to start your list.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={(id) => void handleComplete(id)}
                  onSkip={(id) => void handleSkip(id, task.skipCount || 0)}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}