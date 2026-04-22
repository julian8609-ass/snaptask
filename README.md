# AI-Powered To-Do List Application

A modern, intelligent task management application built with **Next.js 16**, **React 19**, **Material UI**, and **Google Gemini AI**.

## ✨ Features

### 🤖 AI-Powered Capabilities
- **Task Suggestions**: AI analyzes your tasks and suggests improvements
- **Auto-Subtasks**: Automatically breaks complex tasks into subtasks
- **Smart Prioritization**: AI predicts priority levels and estimated durations
- **Natural Language Processing**: Convert natural language like "Call John tomorrow morning" into structured tasks
- **Intelligent Categorization**: Auto-tag and categorize tasks (Work, Personal, etc.)
- **Smart Reminders**: AI-powered reminder system based on predicted urgency

### 📊 Dashboard & Organization
- Real-time task statistics and progress tracking
- Filter tasks by status, category, and priority
- Task completion progress bar
- Responsive Material UI design

### 🔐 Data & Performance
- **Supabase PostgreSQL** for reliable data storage
- **Context API** for efficient state management
- Real-time updates
- Optimized queries with proper indexing

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2, React 19, TypeScript |
| UI Library | Material UI 5, Emotion |
| State Management | React Context API |
| Database | Supabase (PostgreSQL) |
| AI Engine | Google Gemini API |
| Date Handling | date-fns |
| Animations | Framer Motion |

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key

### Quick Start

```bash
# Clone and install
git clone <repository>
cd snaptask
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Full Setup Instructions
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for:
- Detailed configuration
- Database schema creation
- API key setup
- Deployment instructions

## 📂 Project Structure

```
app/
├── page.tsx              # Landing page
├── layout.tsx           # Root layout
├── tasks/page.tsx       # Main app
└── api/
    ├── tasks/           # Task CRUD endpoints
    └── ai/              # AI analysis endpoints

components/
├── Providers.tsx        # Theme & Context setup
├── tasks/              # Task components
├── ai/                 # AI feature components
└── ui/                 # UI components

context/
└── TaskContext.tsx      # Global state

lib/
├── db/                  # Database operations
├── ai/                  # AI integrations
└── utils/              # Utilities

types/
└── index.ts            # TypeScript definitions
```

## 🎯 API Endpoints

### Tasks
```
GET    /api/tasks           # Fetch all tasks
POST   /api/tasks           # Create task (with AI analysis)
GET    /api/tasks/:id       # Get single task
PATCH  /api/tasks/:id       # Update task
DELETE /api/tasks/:id       # Delete task
```

### AI
```
POST   /api/ai/analyze      # Get AI suggestions
```

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Google Gemini
NEXT_PUBLIC_GEMINI_API_KEY=your_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 💡 Usage Examples

### Create a Task with AI
```typescript
// User inputs: "Call John tomorrow morning about the project"
// AI automatically:
// - Extracts date/time: tomorrow at 9:00 AM
// - Sets priority: medium
// - Categorizes: Personal/Work
// - Suggests subtasks
```

### View Smart Suggestions
```
Task: "Plan weekend trip"
AI Suggestions:
  → Check airline prices
  → Book hotel
  → Plan activities
```

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure and queries
- [Type Definitions](./types/index.ts) - TypeScript interfaces

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel deploy
# Set environment variables in Vercel dashboard
```

### Other Platforms
```bash
npm run build
npm start
```

## 🎨 Customization

### Change Theme Colors
Edit `components/Providers.tsx` and modify the Material UI theme.

### Modify AI Behavior
Edit prompts in `lib/ai/gemini.ts`.

### Add Categories
Update the CATEGORIES array in `components/tasks/TaskForm.tsx`.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not working | Verify keys in `.env.local`, check expiration |
| Database connection failed | Confirm Supabase URL and credentials |
| AI not responding | Check Gemini API quota and key validity |
| Tasks not loading | Check browser console for network errors |

## 📊 Performance Tips

1. Database queries are indexed by `user_id`, `status`, and `due_date`
2. Context API prevents unnecessary re-renders
3. Material UI components are optimized
4. Supabase caches frequently accessed data

## 🔒 Security

- Row-level security (RLS) policies on database
- API keys in environment variables only
- User data isolation by user_id
- No sensitive data in client-side code

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style.

## 📄 License

MIT Licensed - see LICENSE file for details

## 🔗 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Material UI Docs](https://mui.com)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API](https://deepmind.google/technologies/gemini/)

---

**Built with ❤️ using AI and modern web technologies**
