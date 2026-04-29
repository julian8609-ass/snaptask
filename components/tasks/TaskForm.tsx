'use client';

import React, { useState, useMemo } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
  Box,
  Typography,
  Chip,
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
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate energy cost based on priority
  const energyCost = useMemo(() => {
    return selectedPriority ? energyByPriority[selectedPriority] : 0;
  }, [selectedPriority]);

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
      const newTask = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory || undefined,
        priority: (selectedPriority as 'low' | 'medium' | 'high' | 'urgent') || undefined,
        status: 'todo',
        tags: [],
        energy: energyCost || undefined,
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

            {energyCost > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  backgroundColor: '#fff3e0',
                  borderRadius: 1,
                  border: '1px solid #ffe0b2',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#e65100', fontWeight: 600 }}>
                  Estimated Energy Cost:
                </Typography>
                <Chip
                  label={`${energyCost} energy`}
                  size="small"
                  sx={{
                    backgroundColor: '#f97316',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                      px: 1.5,
                    },
                  }}
                />
              </Box>
            )}

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
