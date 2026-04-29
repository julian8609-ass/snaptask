// TypeScript types for the AI-powered To-Do app

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  due_date?: string; // ISO string
  estimated_duration?: number; // minutes
  energy?: number;
  xp?: number;
  skipCount?: number;
  source?: 'AI' | 'USER';
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  subtasks?: Subtask[];
  ai_metadata?: AIMetadata;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface AIMetadata {
  extracted_datetime?: string;
  confidence_score?: number;
  suggested_priority?: string;
  suggested_category?: string;
  natural_language_input?: string;
  ai_suggestions?: AISuggestion[];
  reminder_urgency?: number;
  estimated_completion_hours?: number;
}

export interface AISuggestion {
  type: 'subtask' | 'related_task' | 'priority' | 'deadline' | 'category';
  content: string;
  confidence: number;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id?: string;
  event_id?: string;
  title: string;
  description?: string;
  reminder_time: string; // ISO string
  reminder_type: 'notification' | 'email' | 'sms';
  is_sent: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notification_enabled?: boolean;
  auto_categorize?: boolean;
  language?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  energy: number;
  maxEnergy: number;
  xp: number;
}

export interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  suggestions?: AISuggestion[];
}
