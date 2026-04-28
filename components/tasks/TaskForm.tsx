'use client';

import React, { useState } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
} from '@mui/material';
import { useTaskContext } from '@/context/TaskContext';

const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Education', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const energyByPriority: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export function TaskForm() {
  const { addTask, loading } = useTaskContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create task with AI analysis
      const energy = (selectedPriority && energyByPriority[selectedPriority]) || 0;

      const newTask = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory || undefined,
        priority: (selectedPriority as 'low' | 'medium' | 'high' | 'urgent') || undefined,
        energy,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        status: 'todo',
        tags: [],
      });

      if (newTask) {
        setTitle('');
        setDescription('');
        setSelectedCategory(null);
        setSelectedPriority(null);
      } else {
        setError('Failed to create task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card sx={{ mb: 3, boxShadow: 3 }}>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Task Title"
              placeholder="Enter a task (e.g., 'Call John tomorrow morning')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || isAnalyzing}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || isAnalyzing}
              multiline
              rows={3}
              variant="outlined"
            />

            <Stack direction="row" spacing={2}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={CATEGORIES}
                value={selectedCategory}
                onChange={(e, value) => setSelectedCategory(value)}
                disabled={loading || isAnalyzing}
                renderInput={(params) => (
                  <TextField {...params} label="Category" />
                )}
              />

              <Autocomplete
                sx={{ flex: 1 }}
                options={PRIORITIES}
                value={selectedPriority}
                onChange={(e, value) => setSelectedPriority(value)}
                disabled={loading || isAnalyzing}
                renderInput={(params) => (
                  <TextField {...params} label="Priority" />
                )}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Schedule Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={loading || isAnalyzing}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Time (Optional)"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={loading || isAnalyzing}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Energy Cost"
                value={(selectedPriority && energyByPriority[selectedPriority]) ?? 0}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ width: 140 }}
              />
              <div style={{ alignSelf: 'center', color: '#9e9e9e', fontSize: 13 }}>
                Energy reflects estimated effort for the selected priority.
              </div>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || isAnalyzing || !title.trim()}
              sx={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#0a0a0a',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                },
              }}
            >
              {isAnalyzing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Analyzing with AI...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
