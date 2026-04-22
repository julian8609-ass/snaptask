'use client';

type PersonalityOption = 'calm_mentor' | 'strict_coach' | 'funny_friend';

interface PersonalitySelectorProps {
  value: PersonalityOption;
  onChange: (personality: PersonalityOption) => void;
}

const personalities: Array<{ id: PersonalityOption; label: string }> = [
  { id: 'calm_mentor', label: 'Calm Mentor' },
  { id: 'strict_coach', label: 'Strict Coach' },
  { id: 'funny_friend', label: 'Funny Friend' },
];

export function PersonalitySelector({ value, onChange }: PersonalitySelectorProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {personalities.map((personality) => (
        <button
          key={personality.id}
          type="button"
          onClick={() => onChange(personality.id)}
          className={`group flex min-w-0 min-h-[220px] w-full flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-left text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-xl ${
            value === personality.id ? 'ring-1 ring-cyan-300/60 bg-slate-900/90' : 'bg-slate-950/70'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="text-sm uppercase tracking-[0.35em] text-slate-300">
              {personality.label}
            </div>
            <p className="text-sm leading-7 text-slate-300 whitespace-normal">
              {personality.id === 'calm_mentor' && 'Friendly encouragement with gentle guidance.'}
              {personality.id === 'strict_coach' && 'Direct guidance that keeps you accountable.'}
              {personality.id === 'funny_friend' && 'Playful nudges with a smile.'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
