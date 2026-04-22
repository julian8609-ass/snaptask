# Database Schema Documentation

## Overview
This document describes the Supabase PostgreSQL database schema for the AI-powered To-Do app.

## Tables

### 1. Users Table
Stores user profile and preferences.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique user identifier
- `email`: User's email address (unique)
- `full_name`: Optional user's full name
- `preferences`: JSON object with user settings
  - `theme`: 'light' or 'dark'
  - `notification_enabled`: Boolean
  - `auto_categorize`: Boolean
  - `language`: Language code
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

---

### 2. Tasks Table
Core table storing all tasks and their metadata.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Education', 'Other')),
  tags TEXT[] DEFAULT '{}',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'completed', 'archived')),
  due_date TIMESTAMPTZ,
  estimated_duration INTEGER, -- in minutes
  subtasks JSONB DEFAULT '[]',
  ai_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CREATE INDEX idx_tasks_user_id ON tasks(user_id),
  CREATE INDEX idx_tasks_status ON tasks(status),
  CREATE INDEX idx_tasks_category ON tasks(category),
  CREATE INDEX idx_tasks_due_date ON tasks(due_date)
);
```

**Columns:**
- `id`: Unique task identifier
- `user_id`: Foreign key to users table
- `title`: Task title (required)
- `description`: Detailed task description
- `category`: Pre-defined category
- `tags`: Array of custom tags
- `priority`: Priority level
- `status`: Current task status
- `due_date`: When task should be completed
- `estimated_duration`: Time estimate in minutes
- `subtasks`: JSON array of subtasks
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "completed": boolean,
      "order": number
    }
  ]
  ```
- `ai_metadata`: AI analysis data
  ```json
  {
    "extracted_datetime": "ISO string or null",
    "confidence_score": 0-1,
    "estimated_completion_hours": number,
    "ai_suggestions": [
      {
        "type": "subtask|priority|deadline|category",
        "content": "string",
        "confidence": 0-1
      }
    ]
  }
  ```
- `created_at`: Task creation timestamp
- `updated_at`: Last modification timestamp
- `completed_at`: When task was marked complete

---

### 3. Reminders Table
Stores reminder schedules and status.

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'notification', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CREATE INDEX idx_reminders_user_id ON reminders(user_id),
  CREATE INDEX idx_reminders_status ON reminders(status),
  CREATE INDEX idx_reminders_remind_at ON reminders(remind_at)
);
```

**Columns:**
- `id`: Unique reminder identifier
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users
- `remind_at`: When to send reminder (ISO timestamp)
- `type`: Reminder delivery method
- `status`: Reminder status
- `created_at`: Reminder creation time

---

## Data Types

### JSON Fields

#### ai_metadata Structure
```typescript
interface AIMetadata {
  extracted_datetime?: string;      // Parsed date from natural language
  confidence_score?: number;        // 0-1
  estimated_completion_hours?: number;
  ai_suggestions?: AISuggestion[];
  suggested_priority?: string;
  suggested_category?: string;
}

interface AISuggestion {
  type: 'subtask' | 'priority' | 'deadline' | 'category';
  content: string;
  confidence: number; // 0-1
}
```

#### preferences Structure
```typescript
interface UserPreferences {
  theme?: 'light' | 'dark';
  notification_enabled?: boolean;
  auto_categorize?: boolean;
  language?: string;
}
```

---

## Indexes

For optimal performance:

```sql
-- Queries by user
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);

-- Filtering by status
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_reminders_status ON reminders(status);

-- Filtering by category
CREATE INDEX idx_tasks_category ON tasks(category);

-- Sorting by due date
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Reminders to send
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
```

---

## Row Level Security (RLS)

Recommended RLS policies for security:

```sql
-- Users can only see their own tasks
CREATE POLICY "Users can only read own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only create tasks for themselves
CREATE POLICY "Users can only create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tasks
CREATE POLICY "Users can only update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own tasks
CREATE POLICY "Users can only delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for reminders table
```

---

## Sample Queries

### Get all pending tasks for a user
```sql
SELECT * FROM tasks 
WHERE user_id = 'user-uuid' 
  AND status IN ('todo', 'in_progress')
  AND (due_date IS NULL OR due_date > NOW())
ORDER BY priority DESC, due_date ASC;
```

### Get overdue tasks
```sql
SELECT * FROM tasks 
WHERE user_id = 'user-uuid' 
  AND status != 'completed'
  AND due_date < NOW();
```

### Get tasks by category
```sql
SELECT * FROM tasks 
WHERE user_id = 'user-uuid' 
  AND category = 'Work'
ORDER BY priority DESC;
```

### Get pending reminders
```sql
SELECT r.*, t.title FROM reminders r
JOIN tasks t ON r.task_id = t.id
WHERE r.status = 'pending' AND r.remind_at <= NOW()
ORDER BY r.remind_at ASC;
```

---

## Migrations

To modify the schema after initial setup, use Supabase migrations:

```bash
supabase migration new add_new_column
# Edit the SQL file, then:
supabase db push
```

---

## Backup & Recovery

Supabase automatically backs up your database. To restore:

1. Go to Supabase Dashboard
2. Settings → Backups
3. Select a backup and restore

---

## Performance Considerations

1. **Indexes**: All frequently queried columns are indexed
2. **Partitioning**: Consider partitioning tasks table by user_id for very large datasets
3. **JSON columns**: Use JSONB for efficient querying
4. **Materialized Views**: For complex reports, consider materialized views

---

## Related Files

- Database operations: `lib/db/tasks.ts`
- Supabase client: `lib/db/supabase.ts`
- Type definitions: `types/index.ts`
