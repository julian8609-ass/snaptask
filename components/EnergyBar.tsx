'use client';

interface EnergyBarProps {
  energy: number;
  maxEnergy: number;
}

export function EnergyBar({ energy, maxEnergy }: EnergyBarProps) {
  const percentage = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  const colorClass =
    energy >= 4 ? 'bg-emerald-400' : energy >= 2 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="rounded-3xl bg-white/10 p-4 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 text-sm text-slate-200">
        <div className="font-semibold">Energy</div>
        <div>{energy}/{maxEnergy}</div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
