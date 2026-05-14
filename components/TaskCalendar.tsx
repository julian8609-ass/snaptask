'use client';

import { useState, useMemo } from 'react';
import { getMonth, getYear, getDaysInMonth, startOfMonth, format, addMonths, subMonths } from 'date-fns';

type TaskType = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  energy: number;
  status: 'todo' | 'completed' | 'skipped';
  skipCount: number;
  xp: number;
  source: 'USER' | 'AI';
  createdAt?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};

interface TaskCalendarProps {
  tasks: TaskType[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const monthStart = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = new Date(getYear(currentDate), getMonth(currentDate), 1);
  const startingDayOfWeek = startDate.getDay();

  const scheduledTasksByDate = useMemo(() => {
    const map: Record<string, TaskType[]> = {};
    tasks.forEach((task) => {
      if (task.scheduledDate) {
        const dateObj = new Date(task.scheduledDate);
        const dateStr = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).toDateString();
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(task);
      }
    });
    return map;
  }, [tasks]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarDays = [...Array(startingDayOfWeek).fill(null), ...days];

  const getScheduledTasksForDay = (day: number) => {
    const dateStr = new Date(getYear(currentDate), getMonth(currentDate), day).toDateString();
    return scheduledTasksByDate[dateStr] || [];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      getMonth(currentDate) === getMonth(today) &&
      getYear(currentDate) === getYear(today)
    );
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
          <p className="text-xs text-slate-500">{tasks.filter((task) => task.scheduledDate).length} scheduled</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/20"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/20"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={`day-${idx}`} className="py-0.5 text-center text-[0.68rem] font-bold text-slate-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const scheduledTasks = day ? getScheduledTasksForDay(day) : [];
          const hasScheduledTasks = scheduledTasks.length > 0;

          return (
            <div
              key={index}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl p-0.5 text-xs transition-all ${
                day === null
                  ? 'bg-transparent'
                  : isToday(day)
                  ? 'border border-orange-300 bg-orange-500/20 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]'
                  : hasScheduledTasks
                  ? 'border border-orange-400/45 bg-orange-500/10'
                  : 'border border-white/8 bg-slate-950/70 hover:bg-slate-900/90'
              }`}
              onMouseEnter={() => hasScheduledTasks && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {day && (
                <>
                  <span className={`text-xs font-semibold ${isToday(day) ? 'text-orange-300' : hasScheduledTasks ? 'text-orange-400' : 'text-slate-200'}`}>
                    {day}
                  </span>
                  {hasScheduledTasks && (
                    <span className="mt-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-orange-400 px-1 text-[0.6rem] font-bold leading-none text-slate-950">
                      {scheduledTasks.length}
                    </span>
                  )}

                  {/* Tooltip with scheduled tasks */}
                  {hoveredDay === day && hasScheduledTasks && (
                    <div className="absolute bottom-full left-1/2 z-50 mb-2 min-w-[180px] max-w-xs -translate-x-1/2 whitespace-nowrap rounded-xl border border-orange-400/50 bg-slate-950 p-2 shadow-2xl shadow-black/50">
                      <div className="text-xs text-orange-400 font-semibold mb-1">Scheduled tasks:</div>
                      <div className="space-y-1">
                        {scheduledTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="text-xs text-slate-200 truncate">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              task.difficulty === 'hard' ? 'bg-rose-400' : 
                              task.difficulty === 'medium' ? 'bg-orange-400' : 
                              'bg-orange-500'
                            }`} />
                            {task.title}
                            {task.scheduledTime && <span className="text-slate-400"> @ {task.scheduledTime}</span>}
                          </div>
                        ))}
                        {scheduledTasks.length > 3 && (
                          <div className="text-xs text-slate-400">+{scheduledTasks.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Easy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <span>Hard</span>
        </div>
      </div>
    </div>
  );
}
