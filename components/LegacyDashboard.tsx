'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskCalendar } from '@/components/TaskCalendar';
import { getDemoUserId } from '@/lib/user-utils';

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
      const userId = getDemoUserId();
      const response = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
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
      const userId = getDemoUserId();
      const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
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
    const userId = getDemoUserId();
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId,
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
    const userId = getDemoUserId();
    await fetch(`/api/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'completed' }),
    });

    await loadTasks();
  };

  const handleSkip = async (taskId: string, currentSkipCount: number) => {
    const userId = getDemoUserId();
    await fetch(`/api/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ skipCount: currentSkipCount + 1 }),
    });

    await loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    const userId = getDemoUserId();
    await fetch(`/api/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    await loadTasks();
  };

  return (
    <main className="min-h-screen px-3 py-3 text-slate-100 sm:px-5 lg:px-7">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 sm:gap-4">
        <div className="grid gap-3">
          <section className="surface-card p-4 sm:p-5">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">SnapTask command center</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">Plan, prioritize, execute.</h1>
                <p className="mt-1 text-sm text-slate-300">A compact task cockpit for AI ideas, manual tasks, streaks, and daily focus.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-2 text-sm text-slate-100 shadow-inner shadow-black/20 sm:flex">
                <span className="rounded-2xl bg-orange-500/15 px-3 py-2 font-semibold text-orange-100">{activeCount} active</span>
                <span className="rounded-2xl bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-100">{completedCount} done</span>
              </div>
            </header>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-tile">
                <p className="metric-label">Rank</p>
                <p className="metric-value">{loadingProfile ? '...' : rank}</p>
                <p className="mt-1 text-xs text-slate-400">{xp} XP earned</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">Streak</p>
                <p className="metric-value">{loadingProfile ? '...' : (profile?.streak ?? 0)}</p>
                <p className="mt-1 text-xs text-slate-400">Daily momentum</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">Mood</p>
                <p className="metric-value">{loadingProfile ? '...' : (profile?.mood ?? 'focused')}</p>
                <p className="mt-1 text-xs text-slate-400">Profile tone</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">Energy</p>
                <p className="metric-value">{loadingProfile ? '...' : (profile?.energy ?? 0)}</p>
                <p className="mt-1 text-xs text-slate-400">Available today</p>
              </div>
            </div>

            {profileError && (
              <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {profileError}
              </p>
            )}

            <nav className="mt-4 flex flex-wrap gap-2">
              <Link href="/profile" className="pill-link">
                Profile
              </Link>
              <Link href="/tasks" className="pill-link">
                Tasks
              </Link>
              <Link href="/daily-reflection" className="pill-link">
                Daily Reflection
              </Link>
              <Link href="/events" className="pill-link">
                Events
              </Link>
              <Link href="/chat" className="pill-link border-sky-400/25 bg-sky-400/10 text-sky-100">
                Chat
              </Link>
            </nav>

            <form className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.035] p-3 sm:p-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_150px]">
                <label className="app-label min-w-0">
                  Task title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="What needs to move today?"
                    className="app-input placeholder:text-slate-500"
                  />
                </label>

                <label className="app-label">
                  Difficulty
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                    className="app-select"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="app-primary-button w-full self-end px-5"
                >
                  {isSaving ? 'Adding...' : 'Add task'}
                </button>
              </div>

              <label className="app-label mt-3">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional note, context, or next step"
                  rows={3}
                  className="app-textarea placeholder:text-slate-500"
                />
              </label>

              {taskError && (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {taskError}
                </p>
              )}
            </form>
          </section>


        </div>

        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="surface-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Momentum</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Leaderboard</h2>
              </div>
            </div>
            {loadingProfile ? (
              <p className="mt-4 text-sm text-slate-300">Loading leaderboard...</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">No leaderboard data yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="rounded-[18px] border border-white/10 bg-white/[0.045] p-3">
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

          <article className="surface-card p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Schedule</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Calendar</h2>
            <p className="mt-1 text-sm text-slate-400">Scheduled tasks by day.</p>
            <div className="mt-3 rounded-[20px] border border-white/10 bg-slate-950/55 p-3">
              <TaskCalendar tasks={tasks} />
            </div>
          </article>
        </section>

        <section className="surface-card p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Execution queue</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Active task board</h2>
            </div>
            <p className="text-sm text-slate-400">{tasks.length} total tasks</p>
          </div>
          {loadingTasks ? (
            <p className="text-sm text-slate-300">Loading your tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-5 text-slate-200">
              <p className="font-semibold">No tasks yet.</p>
              <p className="mt-1 text-sm text-slate-300">Create one on the left or add a suggestion to start your list.</p>
            </div>
          ) : (
            <div className="grid gap-2 xl:grid-cols-2">
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