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

const STATUS_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  todo: { bg: 'rgba(255,255,255,0.045)', border: 'rgba(255,255,255,0.1)', label: 'Todo' },
  in_progress: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.28)', label: 'In progress' },
  completed: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.28)', label: 'Completed' },
  archived: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)', label: 'Archived' },
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
          mb: 0,
          background: STATUS_STYLES[task.status]?.bg ?? 'rgba(255,255,255,0.045)',
          color: '#f8fafc',
          opacity: isCompleted ? 0.7 : 1,
          border: `1px solid ${STATUS_STYLES[task.status]?.border ?? 'rgba(255,255,255,0.1)'}`,
          borderLeft: `4px solid ${
            task.priority === 'urgent' ? '#d32f2f' :
            task.priority === 'high' ? '#f57c00' :
            task.priority === 'medium' ? '#fbc02d' :
            '#1976d2'
          }`,
          borderRadius: 4,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'rgba(249,115,22,0.36)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <IconButton
              size="small"
              onClick={() =>
                updateTaskStatus(
                  task.id,
                  isCompleted ? 'todo' : 'completed'
                )
              }
              sx={{
                mt: -0.25,
                color: isCompleted ? '#22c55e' : '#94a3b8',
                bgcolor: 'rgba(255,255,255,0.04)',
                '&:hover': { bgcolor: 'rgba(249,115,22,0.12)' },
              }}
            >
              {isCompleted ? (
                <CheckCircleIcon sx={{ color: '#22c55e' }} />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? '#94a3b8' : '#f8fafc',
                  fontWeight: isCompleted ? 500 : 800,
                  lineHeight: 1.25,
                }}
              >
                {task.title}
              </Typography>

              {task.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#cbd5e1',
                    mt: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {task.description}
                </Typography>
              )}

              <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
                <Chip
                  label={STATUS_STYLES[task.status]?.label ?? task.status}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={(task.priority ? task.priority.toUpperCase() : 'LOW')}
                  color={PRIORITY_COLORS[task.priority] || 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ color: '#fed7aa', borderColor: 'rgba(249,115,22,0.35)', fontWeight: 700 }}
                />

                {task.category && (
                  <Chip
                    label={task.category}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: 'rgba(56,189,248,0.12)', color: '#bae6fd', fontWeight: 700 }}
                  />
                )}

                {task.tags?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.12)' }}
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
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
                  Due: {format(new Date(task.due_date), 'MMM dd, yyyy h:mm a')}
                </Typography>
              )}

              {task.ai_metadata?.estimated_completion_hours && (
                <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                  Est. {task.ai_metadata.estimated_completion_hours}h to complete
                </Typography>
              )}
            </Box>

            <IconButton
              size="small"
              onClick={() => setDeleteOpen(true)}
              sx={{
                color: '#fecaca',
                bgcolor: 'rgba(248,113,113,0.08)',
                '&:hover': { bgcolor: 'rgba(248,113,113,0.16)' },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>

          {task.subtasks && task.subtasks.length > 0 && (
            <Box sx={{ mt: 2, ml: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </Typography>
              <Stack spacing={0.5}>
                {task.subtasks.map((subtask) => (
                  <Typography
                    key={subtask.id}
                    variant="body2"
                    sx={{
                      textDecoration: subtask.completed ? 'line-through' : 'none',
                      color: subtask.completed ? '#94a3b8' : '#cbd5e1',
                    }}
                  >
                    - {subtask.title}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#111111',
            color: '#f8fafc',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
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
