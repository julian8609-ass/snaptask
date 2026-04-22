'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Task } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { format } from 'date-fns';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
}

const PRIORITY_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
};

const STATUS_COLORS: Record<string, string> = {
  todo: '#e0e0e0',
  in_progress: '#bbdefb',
  completed: '#c8e6c9',
  archived: '#f5f5f5',
};

export function TaskCard({ task }: TaskCardProps) {
  const { updateTaskStatus, deleteTaskById } = useTaskContext();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    await deleteTaskById(task.id);
    setDeleteOpen(false);
  };

  const isCompleted = task.status === 'completed';
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

  return (
    <>
      <Card
        sx={{
          mb: 2,
          backgroundColor: STATUS_COLORS[task.status],
          opacity: isCompleted ? 0.7 : 1,
          borderLeft: `4px solid ${
            task.priority === 'urgent' ? '#d32f2f' :
            task.priority === 'high' ? '#f57c00' :
            task.priority === 'medium' ? '#fbc02d' :
            '#1976d2'
          }`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
            <IconButton
              size="small"
              onClick={() =>
                updateTaskStatus(
                  task.id,
                  isCompleted ? 'todo' : 'completed'
                )
              }
              sx={{ mt: -0.5 }}
            >
              {isCompleted ? (
                <CheckCircleIcon sx={{ color: 'green' }} />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? 'gray' : 'black',
                  fontWeight: isCompleted ? 400 : 600,
                }}
              >
                {task.title}
              </Typography>

              {task.description && (
                <Typography variant="body2" sx={{ color: 'gray', mt: 0.5 }}>
                  {task.description}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={(task.priority ? task.priority.toUpperCase() : 'LOW')}
                  color={PRIORITY_COLORS[task.priority] || 'default'}
                  size="small"
                  variant="outlined"
                />

                {task.category && (
                  <Chip
                    label={task.category}
                    size="small"
                    variant="filled"
                  />
                )}

                {task.tags?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}

                {isOverdue && (
                  <Chip
                    label="OVERDUE"
                    color="error"
                    size="small"
                    variant="filled"
                  />
                )}
              </Stack>

              {task.due_date && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'gray' }}>
                  Due: {format(new Date(task.due_date), 'MMM dd, yyyy h:mm a')}
                </Typography>
              )}

              {task.ai_metadata?.estimated_completion_hours && (
                <Typography variant="caption" sx={{ display: 'block', color: 'gray' }}>
                  Est. {task.ai_metadata.estimated_completion_hours}h to complete
                </Typography>
              )}
            </Box>

            <IconButton
              size="small"
              onClick={() => setDeleteOpen(true)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Stack>

          {task.subtasks && task.subtasks.length > 0 && (
            <Box sx={{ mt: 2, ml: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </Typography>
              <Stack spacing={0.5}>
                {task.subtasks.map((subtask) => (
                  <Typography
                    key={subtask.id}
                    variant="body2"
                    sx={{
                      textDecoration: subtask.completed ? 'line-through' : 'none',
                      color: subtask.completed ? 'gray' : 'black',
                    }}
                  >
                    • {subtask.title}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {task.title}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
