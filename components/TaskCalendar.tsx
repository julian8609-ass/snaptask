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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{format(currentDate, 'MMM yyyy')}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded px-2 py-0.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-400/20"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded px-2 py-0.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded px-2 py-0.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-400/20"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={`day-${idx}`} className="text-center text-xs text-slate-400 font-semibold py-0.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, index) => {
          const scheduledTasks = day ? getScheduledTasksForDay(day) : [];
          const hasScheduledTasks = scheduledTasks.length > 0;

          return (
            <div
              key={index}
              className={`aspect-square rounded text-xs transition-all flex flex-col items-center justify-center p-0.5 relative group ${
                day === null
                  ? 'bg-transparent'
                  : isToday(day)
                  ? 'border border-orange-400 bg-orange-500/15'
                  : hasScheduledTasks
                  ? 'border border-orange-400/50 bg-[#161616]'
                  : 'border border-white/5 bg-slate-950/80 hover:bg-slate-900/80'
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
                    <span className="inline-flex items-center justify-center rounded-full bg-orange-400 w-3 h-3 text-xs font-bold text-slate-950 leading-none">
                      {scheduledTasks.length}
                    </span>
                  )}

                  {/* Tooltip with scheduled tasks */}
                  {hoveredDay === day && hasScheduledTasks && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-orange-400/50 rounded-lg p-2 whitespace-nowrap z-50 shadow-lg min-w-[180px] max-w-xs">
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
      <div className="mt-3 flex gap-3 text-xs text-slate-400">
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
