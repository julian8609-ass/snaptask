'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface TaskSchedulerProps {
  onSchedule: (date: string, time: string) => void;
  onClear: () => void;
  scheduledDate?: string;
  scheduledTime?: string;
}

export function TaskScheduler({ onSchedule, onClear, scheduledDate, scheduledTime }: TaskSchedulerProps) {
  const [date, setDate] = useState(scheduledDate || '');
  const [time, setTime] = useState(scheduledTime || '');

  const handleSchedule = () => {
    if (date) {
      onSchedule(date, time);
    }
  };

  return (
    <div className="space-y-3">
      <label className="grid gap-2 text-sm text-slate-200">
        Schedule Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none transition focus:border-emerald-300"
        />
      </label>
      
      <label className="grid gap-2 text-sm text-slate-200">
        Time (Optional)
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none transition focus:border-emerald-300"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={handleSchedule}
          className="flex-1 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          disabled={!date}
        >
          Schedule
        </button>
        {(date || time) && (
          <button
            onClick={() => {
              setDate('');
              setTime('');
              onClear();
            }}
            className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {date && (
        <div className="text-xs text-slate-300 rounded-lg bg-white/5 p-3">
          <p>Scheduled for: <span className="font-semibold text-emerald-300">{format(new Date(date), 'MMM d, yyyy')}</span></p>
          {time && <p>Time: <span className="font-semibold text-emerald-300">{time}</span></p>}
        </div>
      )}
    </div>
  );
}
