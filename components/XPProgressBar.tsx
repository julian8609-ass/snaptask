'use client';

interface XPProgressBarProps {
  xp: number;
}

export function XPProgressBar({ xp }: XPProgressBarProps) {
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const progress = Math.min(100, (xp % 100));
  const progressClass = progress > 75 ? 'bg-emerald-400' : progress > 40 ? 'bg-amber-400' : 'bg-sky-400';

  return (
    <div className="rounded-[2rem] bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>Level {level}</span>
        <span>{progress}% to next level</span>
      </div>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${progressClass} transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
