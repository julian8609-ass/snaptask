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

  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No tasks yet. Create one to get started!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Filter:</Typography>
        <ButtonGroup size="small">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'contained' : 'outlined'}
              onClick={() => setFilter(f)}
              sx={{ textTransform: 'capitalize' }}
            >
              {f === 'in_progress' ? 'In Progress' : f}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      {filteredTasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No tasks with status {filter}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
