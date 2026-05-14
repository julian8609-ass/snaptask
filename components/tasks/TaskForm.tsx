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
    <Card
      sx={{
        mb: 0,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'none',
        color: '#f8fafc',
        '& .MuiInputLabel-root': { color: '#94a3b8' },
        '& .MuiInputLabel-root.Mui-disabled': { color: '#64748b' },
        '& .MuiInputBase-input': { color: '#f8fafc' },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#64748b' },
        '& .MuiAutocomplete-endAdornment .MuiSvgIcon-root': { color: '#94a3b8' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              label="Task Title"
              placeholder="e.g. Call John tomorrow morning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || isAnalyzing}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
              InputProps={{
                sx: {
                  color: '#f8fafc',
                  borderRadius: 3,
                  bgcolor: 'rgba(2,6,23,0.72)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(249,115,22,0.45)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
                },
              }}
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || isAnalyzing}
              multiline
              rows={2}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
              InputProps={{
                sx: {
                  color: '#f8fafc',
                  borderRadius: 3,
                  bgcolor: 'rgba(2,6,23,0.72)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(249,115,22,0.45)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
                },
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={CATEGORIES}
                value={selectedCategory}
                onChange={(e, value) => setSelectedCategory(value)}
                disabled={loading || isAnalyzing}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    size="small"
                    InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        color: '#f8fafc',
                        borderRadius: 3,
                        bgcolor: 'rgba(2,6,23,0.72)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(249,115,22,0.45)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
                      },
                    }}
                  />
                )}
              />

              <Autocomplete
                sx={{ flex: 1 }}
                options={PRIORITIES}
                value={selectedPriority}
                onChange={(e, value) => setSelectedPriority(value)}
                disabled={loading || isAnalyzing}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Priority"
                    size="small"
                    InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        color: '#f8fafc',
                        borderRadius: 3,
                        bgcolor: 'rgba(2,6,23,0.72)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(249,115,22,0.45)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
                      },
                    }}
                  />
                )}
              />
            </Stack>

            {energyCost > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.25,
                  backgroundColor: 'rgba(249,115,22,0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(249,115,22,0.22)',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#fed7aa', fontWeight: 700 }}>
                  Energy Cost
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
                borderRadius: 999,
                py: 1.15,
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
