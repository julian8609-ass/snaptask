'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { AISuggestion } from '@/types';

interface AISuggestionsProps {
  taskTitle: string;
  suggestions?: AISuggestion[];
  isLoading?: boolean;
}

export function AISuggestions({
  taskTitle,
  suggestions = [],
  isLoading = false,
}: AISuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const groupedByType = suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = [];
      }
      acc[suggestion.type].push(suggestion);
      return acc;
    },
    {} as Record<string, AISuggestion[]>
  );

  return (
    <Card
      sx={{
        mt: 2,
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        border: '1px solid #b3e5fc',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SmartToyIcon sx={{ color: '#667eea' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            AI-Powered Suggestions
          </Typography>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Analyzing your task...</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {Object.entries(groupedByType).map(([type, items]) => (
              <Box key={type}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <LightbulbIcon sx={{ fontSize: 18, color: '#fbc02d' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {type === 'related_task' ? 'Related Tasks' : type}
                  </Typography>
                </Stack>

                <Stack spacing={1} sx={{ ml: 3 }}>
                  {items.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        borderLeft: `3px solid #667eea`,
                      }}
                    >
                      <Typography variant="body2">{item.content}</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`${Math.round(item.confidence * 100)}% confidence`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
