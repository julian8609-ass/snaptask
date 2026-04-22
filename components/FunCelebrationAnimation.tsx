'use client';

export function FunCelebrationAnimation() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 overflow-hidden">
      <div className="relative mx-auto h-0 w-full max-w-7xl">
        {[...Array(12)].map((_, index) => (
          <div
            key={index}
            className="absolute top-0 h-6 w-2 rounded-full bg-emerald-400 opacity-90 animate-fall"
            style={{ left: `${index * 8}%`, animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(360deg); opacity: 0; }
        }
        .animate-fall { animation: fall 1.8s ease-in forwards; }
      `}</style>
    </div>
  );
}
