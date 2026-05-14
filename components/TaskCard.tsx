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
  easy: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
  medium: 'bg-orange-500/15 text-orange-200 ring-orange-300/20',
  hard: 'bg-rose-400/15 text-rose-200 ring-rose-300/20',
};

export function TaskCard({ task, onComplete, onSkip, onDelete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  return (
    <article className="group rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-3 shadow-xl shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.075] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-300">
            <span className={`rounded-full px-2.5 py-1 ring-1 ${difficultyStyles[task.difficulty]}`}>
              {task.difficulty}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200 ring-1 ring-white/10">
              {task.energy} energy
            </span>
            <span className={`rounded-full px-2.5 py-1 ring-1 ${isCompleted ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-300/20' : 'bg-sky-500/10 text-sky-200 ring-sky-300/20'}`}>
              {isCompleted ? 'completed' : 'todo'}
            </span>
          </div>
          <h3 className={`truncate text-base font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
            {task.title}
          </h3>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full rounded-full ${isCompleted ? 'w-full bg-emerald-400' : 'w-1/3 bg-orange-400'}`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:w-[118px] sm:grid-cols-1">
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            disabled={isCompleted}
            className="rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isCompleted ? 'Done' : 'Complete'}
          </button>
          <button
            type="button"
            onClick={() => onSkip(task.id)}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          >
            Skip {task.skipCount > 0 ? `(${task.skipCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-full bg-rose-500/90 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-400"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
