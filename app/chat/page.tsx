'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import AddTaskIcon from '@mui/icons-material/PlaylistAdd';

import { getDemoUserId } from '@/lib/user-utils';
import type { SuggestedChatTask } from '@/lib/ai/chat-suggested-tasks';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  suggestedTasks?: SuggestedChatTask[];
}

function priorityToDifficulty(p: SuggestedChatTask['priority']): 'easy' | 'medium' | 'hard' {
  if (p === 'low') return 'easy';
  if (p === 'medium') return 'medium';
  return 'hard';
}

const markdownComponents: Partial<Components> = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <Typography component="p" variant="body2" sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ul" sx={{ pl: 2, my: 1 }}>
      {children}
    </Box>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ol" sx={{ pl: 2, my: 1 }}>
      {children}
    </Box>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <Typography component="li" variant="body2" sx={{ display: 'list-item', mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <Typography
      component="a"
      variant="body2"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ color: '#fdba74', textDecoration: 'underline' }}
    >
      {children}
    </Typography>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: '3px solid rgba(249, 115, 22, 0.5)',
        pl: 1.5,
        my: 1,
        color: '#cbd5e1',
      }}
    >
      {children}
    </Box>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <Box
      component="pre"
      sx={{
        overflow: 'auto',
        maxWidth: '100%',
        p: 1.5,
        my: 1,
        borderRadius: 2,
        bgcolor: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        '& code': { bgcolor: 'transparent', p: 0, fontSize: 'inherit' },
      }}
    >
      {children}
    </Box>
  ),
  code: ({ className, children, ...rest }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = Boolean(className?.includes('language-'));
    if (isBlock) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <Box
        component="code"
        sx={{
          bgcolor: 'rgba(255,255,255,0.1)',
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: '0.8125rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <Box sx={{ overflow: 'auto', my: 1 }}>
      <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8125rem' }}>
        {children}
      </Box>
    </Box>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <Box component="th" sx={{ border: '1px solid rgba(255,255,255,0.12)', p: 1, textAlign: 'left' }}>
      {children}
    </Box>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <Box component="td" sx={{ border: '1px solid rgba(255,255,255,0.08)', p: 1 }}>
      {children}
    </Box>
  ),
};

function MessageBody({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'assistant') {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    );
  }
  return (
    <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      {content}
    </Typography>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);
  const [taskActionKey, setTaskActionKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  const addSuggestedTask = useCallback(
    async (messageIndex: number, taskIndex: number, task: SuggestedChatTask) => {
      const key = `${messageIndex}-${taskIndex}`;
      setTaskActionKey(key);
      setError(null);
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: getDemoUserId(),
            title: task.title,
            description: task.description,
            priority: task.priority,
            difficulty: priorityToDifficulty(task.priority),
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Failed to add task (${res.status})`);
        }
        setMessages((prev) =>
          prev.map((msg, i) => {
            if (i !== messageIndex || msg.role !== 'assistant') return msg;
            const next = [...(msg.suggestedTasks || [])];
            next.splice(taskIndex, 1);
            return { ...msg, suggestedTasks: next.length ? next : undefined };
          })
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add task');
      } finally {
        setTaskActionKey(null);
      }
    },
    []
  );

  const addAllSuggestedTasks = useCallback(async (messageIndex: number, tasks: SuggestedChatTask[]) => {
    setTaskActionKey(`all-${messageIndex}`);
    setError(null);
    try {
      for (const task of tasks) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: getDemoUserId(),
            title: task.title,
            description: task.description,
            priority: task.priority,
            difficulty: priorityToDifficulty(task.priority),
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Failed to add task (${res.status})`);
        }
      }
      setMessages((prev) =>
        prev.map((msg, i) => (i === messageIndex && msg.role === 'assistant' ? { ...msg, suggestedTasks: undefined } : msg))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add all tasks');
    } finally {
      setTaskActionKey(null);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    setError(null);
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const historyForApi = [...messagesRef.current, userMessage].map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          context: {
            mood: 'focused',
            personality: 'calm_mentor',
          },
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
        suggestedTasks: Array.isArray(data.suggestedTasks) ? data.suggestedTasks : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue]);

  const expandFallback = useCallback(async () => {
    const thread = messagesRef.current;
    if (!thread.length) return;
    const payload = thread.map(({ role, content }) => ({ role, content }));
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payload,
          context: {
            mood: 'focused',
            personality: 'calm_mentor',
            rank: 'Bronze',
            activeTasks: 0,
            completedTasks: 0,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Expand request failed');
      }

      const data = await response.json();
      const text = data?.message || 'No expanded response available.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: String(text),
          timestamp: Date.now(),
          suggestedTasks: Array.isArray(data.suggestedTasks) ? data.suggestedTasks : undefined,
        },
      ]);
      setIsFallbackMode(Boolean(data?.fallback));
      setFallbackWarning(data?.warning ?? null);
    } catch (err) {
      console.error('Expand fallback error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
              Ask for code help, “give me 5 tasks”, or anything else — add suggested tasks to SnapTask in one tap.
            </Typography>
          </Box>
        )}

        {messages.map((message, index) => (
          <React.Fragment key={message.timestamp ?? index}>
            <Box
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
                  <MessageBody role={message.role} content={message.content} />
                </CardContent>
              </Card>
              {message.role === 'user' && <PersonIcon sx={{ mt: 1, color: '#cbd5e1' }} />}
            </Box>
            {message.role === 'assistant' && message.suggestedTasks && message.suggestedTasks.length > 0 ? (
              <Box sx={{ pl: { xs: 0, sm: 5 }, maxWidth: { xs: '100%', sm: '88%' }, alignSelf: 'flex-start' }}>
                <Alert
                  severity="info"
                  icon={<AddTaskIcon sx={{ color: '#38bdf8' }} />}
                  sx={{
                    mb: 0.5,
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    color: '#e0f2fe',
                    border: '1px solid rgba(14,165,233,0.28)',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#bae6fd' }}>
                    Add to your SnapTask list (saved to your user in the app).
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={taskActionKey !== null}
                      onClick={() => void addAllSuggestedTasks(index, message.suggestedTasks!)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Add all ({message.suggestedTasks.length})
                    </Button>
                    {message.suggestedTasks.map((t, ti) => (
                      <Tooltip key={`${t.title}-${ti}`} title={`${t.title} — ${t.priority}${t.description ? `\n${t.description}` : ''}`}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddTaskIcon sx={{ fontSize: 18 }} />}
                            disabled={taskActionKey !== null}
                            onClick={() => void addSuggestedTask(index, ti, t)}
                            sx={{
                              textTransform: 'none',
                              borderColor: 'rgba(56, 189, 248, 0.45)',
                              color: '#e0f2fe',
                              maxWidth: 260,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.title.length > 36 ? `${t.title.slice(0, 36)}…` : t.title}
                          </Button>
                        </span>
                      </Tooltip>
                    ))}
                  </Stack>
                </Alert>
              </Box>
            ) : null}
          </React.Fragment>
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
