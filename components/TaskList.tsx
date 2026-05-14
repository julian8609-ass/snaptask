'use client';

import { Task } from '@/types';
import { Box, Stack, Typography, Button, ButtonGroup, Paper } from '@mui/material';
import { TaskCard } from './tasks/TaskCard';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
}

const FILTERS = ['all', 'todo', 'in_progress', 'completed', 'archived'] as const;

export function TaskList({ tasks }: TaskListProps) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const filterCounts = FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f] = f === 'all' ? tasks.length : tasks.filter((task) => task.status === f).length;
    return acc;
  }, {});

  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <Typography sx={{ color: '#cbd5e1' }}>
          No tasks yet. Create one to get started!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: '#e2e8f0', minWidth: 52 }}>
          Filter
        </Typography>
        <ButtonGroup
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: 0.75,
            '& .MuiButtonGroup-grouped': {
              borderRadius: '999px !important',
              border: '1px solid rgba(255,255,255,0.1) !important',
              minWidth: 'auto',
              px: 1.5,
            },
          }}
        >
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'contained' : 'outlined'}
              onClick={() => setFilter(f)}
              sx={{
                textTransform: 'capitalize',
                color: filter === f ? '#0b0b0b' : '#fed7aa',
                bgcolor: filter === f ? '#f97316' : 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.1)',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: filter === f ? '#fb923c' : 'rgba(249,115,22,0.12)',
                  borderColor: 'rgba(249,115,22,0.35)',
                },
              }}
            >
              {f === 'in_progress' ? 'In Progress' : f} ({filterCounts[f]})
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      {filteredTasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
          <Typography sx={{ color: '#cbd5e1' }}>
            No tasks with status {filter}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
