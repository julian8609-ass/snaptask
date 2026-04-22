'use client';

import React from 'react';
import { Box, Stack, Typography, LinearProgress, Card, CardContent, Grid } from '@mui/material';
import { TaskStats } from '@/types';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneIcon from '@mui/icons-material/Done';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  total?: number;
}

function StatCard({ title, value, icon, color, total }: StatCardProps) {
  const percentage = total ? ((value as number) / total) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 1.5,
              backgroundColor: `${color}20`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h6">{value}</Typography>
            {total && (
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface StatsOverviewProps {
  stats: TaskStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Your Task Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon={<AssignmentIcon sx={{ color: '#1976d2' }} />}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<DoneIcon sx={{ color: '#28a745' }} />}
            color="#28a745"
            total={stats.total}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<TrendingUpIcon sx={{ color: '#fbc02d' }} />}
            color="#fbc02d"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<WarningIcon sx={{ color: '#d32f2f' }} />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
