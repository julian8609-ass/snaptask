'use client';

import { useState } from 'react';

interface GrokAIButtonProps {
  label: string;
  loading: boolean;
  onClick: (message: string) => void;
}

export function GrokAIButton({ label, loading, onClick }: GrokAIButtonProps) {
  const [chat, setChat] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');

  const handleChat = () => {
    setChat('Grok AI is processing your request...');
    onClick(userMessage);
    setTimeout(() => {
      setChat('Here are some fun tasks to do!'); // Placeholder for AI response
    }, 2000); // Simulate AI response delay
  };

  return (
    <div>
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Ask Grok AI for fun task suggestions..."
        className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="button"
        onClick={handleChat}
        disabled={loading}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Thinking...' : label}
      </button>
      {chat && <p className="mt-4 text-sm text-slate-300">{chat}</p>}
    </div>
  );
}
