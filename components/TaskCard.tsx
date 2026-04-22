'use client';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    energy: number;
    status: 'todo' | 'completed';
    skipCount: number;
  };
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
}

const difficultyStyles: Record<string, string> = {
  easy: 'bg-orange-400/15 text-orange-200',
  medium: 'bg-orange-500/15 text-orange-200',
  hard: 'bg-rose-400/15 text-rose-200',
};

export function TaskCard({ task, onComplete, onSkip, onDelete }: TaskCardProps) {
  return (
    <article className="rounded-[2rem] border border-orange-500/15 bg-[#101010] p-5 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-[#151515]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-300">
            <span className={`rounded-full px-3 py-1 ${difficultyStyles[task.difficulty]}`}>
              {task.difficulty}
            </span>
            <span className="rounded-full bg-[#1b1b1b] px-3 py-1 text-slate-200">
              {task.energy} energy
            </span>
          </div>
          <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'text-slate-300 line-through' : 'text-white'}`}>
            {task.title}
          </h3>
          <div className="mt-3 text-sm text-slate-400">
            {task.status === 'completed' ? 'Completed ✅' : 'Still waiting for your move.'}
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            disabled={task.status === 'completed'}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {task.status === 'completed' ? 'Done' : 'Complete'}
          </button>
          <button
            type="button"
            onClick={() => onSkip(task.id)}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Skip {task.skipCount > 0 ? `(${task.skipCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
