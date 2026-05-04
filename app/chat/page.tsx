'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (e) {
      console.error('Failed to load messages from localStorage', e);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages to localStorage', e);
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    setError(null);
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      setIsFallbackMode(Boolean(data?.fallback));
      setFallbackWarning(data?.warning ?? null);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages]);

  const expandFallback = useCallback(async () => {
    if (!messages.length) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', mood: 'focused', personality: 'calm_mentor', messages }),
      });

      const data = await response.json();
      const text = data?.response || data?.message || 'No expanded response available.';
      setMessages((prev) => [...prev, { role: 'assistant', content: String(text), timestamp: Date.now() }]);
      setIsFallbackMode(false);
      setFallbackWarning(null);
    } catch (err) {
      console.error('Expand fallback error', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        color: '#f8fafc',
        background:
          'radial-gradient(circle at top left, rgba(249, 115, 22, 0.2), transparent 32%), radial-gradient(circle at top right, rgba(251, 146, 60, 0.1), transparent 26%), linear-gradient(180deg, #080808 0%, #000000 100%)',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(5, 5, 5, 0.96)',
          color: 'white',
          borderBottom: '1px solid rgba(249, 115, 22, 0.14)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
              boxShadow: '0 12px 30px rgba(249, 115, 22, 0.28)',
            }}
          >
            <SmartToyIcon sx={{ fontSize: 22, color: '#0b0b0b' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Dark task studio theme
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {isFallbackMode ? (
            <Tooltip title={fallbackWarning ?? 'Using fallback responses'}>
              <Chip label="Fallback mode" color="warning" sx={{ color: '#ffedd5', background: 'rgba(249,115,22,0.12)' }} />
            </Tooltip>
          ) : null}

          <Button
            component={Link}
            href="/dashboard"
            variant="outlined"
            sx={{
              borderColor: 'rgba(249, 115, 22, 0.35)',
              color: '#fed7aa',
              borderRadius: '999px',
              textTransform: 'none',
              px: 2,
              '&:hover': {
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
              },
            }}
          >
            Dashboard
          </Button>

          <Tooltip title="Clear chat history">
            <span>
              <IconButton
                onClick={clearChat}
                sx={{ color: '#f8fafc' }}
                disabled={messages.length === 0}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>

          {isFallbackMode && (
            <Button
              onClick={expandFallback}
              variant="contained"
              sx={{
                ml: 1,
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                color: '#0b0b0b',
                textTransform: 'none',
              }}
            >
              Expand
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background:
            'linear-gradient(180deg, rgba(8, 8, 8, 0.92) 0%, rgba(10, 10, 10, 0.98) 100%)',
        }}
      >
        {messages.length === 0 && !error && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 80, color: '#fb923c' }} />
            <Typography variant="h6" sx={{ color: '#f8fafc' }}>
              Start a conversation with AI
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }} align="center">
              Ask coding questions, general knowledge, or any other topics
            </Typography>
          </Box>
        )}

        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 1,
            }}
          >
            {message.role === 'assistant' && <SmartToyIcon sx={{ mt: 1, color: '#fb923c' }} />}
            <Card
              sx={{
                maxWidth: '70%',
                backgroundColor: message.role === 'user' ? 'rgba(249, 115, 22, 0.95)' : 'rgba(255, 255, 255, 0.06)',
                color: '#f8fafc',
                border: message.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ padding: '12px 16px', '&:last-child': { pb: '12px' } }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </CardContent>
            </Card>
            {message.role === 'user' && <PersonIcon sx={{ mt: 1, color: '#cbd5e1' }} />}
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon sx={{ color: '#fb923c' }} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={20} sx={{ color: '#fb923c' }} />
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Thinking...
              </Typography>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              borderRadius: 3,
              backgroundColor: 'rgba(127, 29, 29, 0.34)',
              color: '#fecaca',
              border: '1px solid rgba(248, 113, 113, 0.2)',
            }}
          >
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          padding: 2,
          backgroundColor: 'rgba(5, 5, 5, 0.96)',
          borderTop: '1px solid rgba(249, 115, 22, 0.14)',
        }}
      >
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            minRows={1}
            placeholder="Type your message... (Shift+Enter for new line)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                color: '#f8fafc',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 3,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(249, 115, 22, 0.45)',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#f97316',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#94a3b8',
                opacity: 1,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{ paddingX: 3 }}
            disableElevation
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
              color: '#0b0b0b',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            <SendIcon />
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#94a3b8' }}>
          Messages are saved locally in your browser
        </Typography>
      </Paper>
    </Box>
  );
}
