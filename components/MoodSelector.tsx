'use client';

type MoodOption = 'tired' | 'focused' | 'lazy' | 'productive';

interface MoodSelectorProps {
  value: MoodOption;
  onChange: (mood: MoodOption) => void;
}

const moods: Array<{ id: MoodOption; label: string; accent: string }> = [
  { id: 'tired', label: 'Tired', accent: 'from-slate-700 to-slate-900' },
  { id: 'focused', label: 'Focused', accent: 'from-cyan-400 to-sky-600' },
  { id: 'lazy', label: 'Lazy', accent: 'from-amber-300 to-orange-400' },
  { id: 'productive', label: 'Productive', accent: 'from-emerald-400 to-lime-500' },
];

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {moods.map((mood) => (
        <button
          key={mood.id}
          type="button"
          onClick={() => onChange(mood.id)}
          className={`group flex min-w-0 min-h-[220px] w-full flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-left text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-xl ${
            value === mood.id ? 'ring-1 ring-emerald-300/60 bg-slate-900/90' : 'bg-slate-950/70'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="text-sm uppercase tracking-[0.35em] text-slate-300">
              {mood.label}
            </div>
            <p className="text-sm leading-7 text-slate-300 whitespace-normal">
              {mood.id === 'tired' && 'Soft, calm suggestions to restore energy.'}
              {mood.id === 'focused' && 'Clear actions for your sharpest flow.'}
              {mood.id === 'lazy' && 'Light tasks that still move the day forward.'}
              {mood.id === 'productive' && 'Power through your strongest streak.'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
