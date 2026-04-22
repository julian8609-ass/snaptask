# AI-Powered To-Do App - Complete Setup Guide

## 📋 Project Overview

This is a modern **AI-powered To-Do list application** built with Next.js 16+, featuring:

- ✅ **AI Task Suggestions** - Automatic task improvement and subtask generation
- ✅ **Smart Prioritization** - AI-powered priority and deadline prediction
- ✅ **Intelligent Categorization** - Auto-tagging and category assignment
- ✅ **Natural Language Processing** - Convert natural language to structured tasks
- ✅ **Smart Reminders** - AI-predicted urgency-based notifications
- ✅ **Real-time UI** - Material UI with responsive design

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.2, React 19, Material UI 5
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Styling**: Material UI + Emotion
- **Other**: date-fns, Framer Motion

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Google Gemini API key

### 2. Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Setup Supabase

Create these tables in your Supabase database:

#### Users Table
```sql
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  full_name text,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Tasks Table
```sql
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  tags text[] default '{}',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  status text check (status in ('todo', 'in_progress', 'completed', 'archived')),
  due_date timestamptz,
  estimated_duration integer, -- in minutes
  subtasks jsonb default '[]',
  ai_metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_category on public.tasks(category);
```

#### Reminders Table
```sql
create table if not exists public.reminders (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  remind_at timestamptz not null,
  type text check (type in ('email', 'notification', 'in_app')),
  status text check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamptz default now()
);

create index idx_reminders_user_id on public.reminders(user_id);
create index idx_reminders_status on public.reminders(status);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
app/
├── page.tsx                 # Homepage
├── layout.tsx              # Root layout with providers
├── tasks/
│   └── page.tsx            # Main to-do application
├── globals.css             # Global styles
└── api/
    ├── tasks/
    │   ├── route.ts        # GET/POST tasks
    │   └── [id]/route.ts   # GET/PATCH/DELETE task
    └── ai/
        └── analyze/route.ts # AI analysis endpoint

components/
├── Providers.tsx           # Theme + Context providers
├── TaskList.tsx            # Task list with filtering
├── TaskForm.tsx            # Task creation form (old)
├── tasks/
│   ├── TaskForm.tsx        # New Material UI form
│   └── TaskCard.tsx        # Individual task card
├── ai/
│   └── AISuggestions.tsx   # AI suggestions display
└── ui/
    └── StatsOverview.tsx   # Dashboard stats

context/
└── TaskContext.tsx         # Global task state management

lib/
├── db/
│   ├── supabase.ts         # Supabase client
│   └── tasks.ts            # Database operations
├── ai/
│   └── gemini.ts           # Google Gemini integration
└── utils/
    └── (additional utilities)

types/
└── index.ts                # TypeScript definitions
```

## 🎯 Key Features Explained

### 1. AI Task Analysis
When you create a task, the app:
- Sends the title and description to Google Gemini
- Receives AI suggestions for priority, category, and duration
- Automatically creates subtasks
- Extracts dates from natural language

### 2. Smart Categorization
Categories: Work, Personal, Shopping, Health, Finance, Education, Other

### 3. Context API State Management
- Global state for tasks and reminders
- Auto-refresh every 30 seconds
- Optimistic UI updates

### 4. Material UI Components
- Professional, responsive design
- Dark mode ready (via theme customization)
- Accessible with ARIA labels

## 🔑 API Endpoints

### Tasks
```
GET    /api/tasks              # Fetch all tasks
POST   /api/tasks              # Create task with AI analysis
GET    /api/tasks/:id          # Get single task
PATCH  /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

### AI
```
POST   /api/ai/analyze         # Analyze and get suggestions
```

## 📝 Environment Setup Details

### Getting Supabase URL and Keys
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your `Project URL` and `Anon key`

### Getting Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local`

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to Git
git push origin main

# Deploy via Vercel
vercel deploy
```

Set environment variables in Vercel dashboard.

### Deploy to Other Platforms

```bash
# Build
npm run build

# Start
npm run start
```

## 🎨 Customization

### Change Theme Colors
Edit `components/Providers.tsx`:
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
  },
});
```

### Modify AI Behavior
Edit `lib/ai/gemini.ts` and adjust prompts.

### Add More Categories
Update `components/tasks/TaskForm.tsx` CATEGORIES array.

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material UI Documentation](https://mui.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://deepmind.google/technologies/gemini/)

## 🐛 Troubleshooting

### API Key Errors
- Ensure API keys are in `.env.local`
- Verify keys are not expired
- Check Supabase project is active

### Database Connection Issues
- Verify Supabase URL is correct
- Check network connectivity
- Ensure tables are created

### AI Suggestions Not Working
- Verify Gemini API key is valid
- Check API quota
- Review browser console for errors

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow existing code style.

---

**Happy Task Management! 🚀**
