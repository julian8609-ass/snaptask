# SnapTask - Quick Start Guide

## 🚀 What's Been Set Up

Your SnapTask project includes:

- **Frontend**: React with Next.js and TypeScript
- **Real-time Updates**: Server-Sent Events (SSE) for live collaboration
- **Styling**: Tailwind CSS with a modern design
- **API**: RESTful endpoints for CRUD operations
- **Database**: In-memory store (ready to swap for PostgreSQL, MongoDB, etc.)

## 📂 Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   │   ├── tasks/        # Task endpoints
│   │   └── events/       # SSE events stream
│   └── tasks/            # Tasks page
├── components/           # React components
│   ├── TaskForm.tsx      # Create/edit tasks
│   └── TaskList.tsx      # Display tasks
├── hooks/                # Custom React hooks
│   └── useRealtimeTasks  # Real-time task updates
├── lib/                  # Utilities
│   └── db.ts             # Database setup
└── types/                # TypeScript definitions
```

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Access the App
- **Home**: [http://localhost:3000](http://localhost:3000)
- **Tasks**: [http://localhost:3000/tasks](http://localhost:3000/tasks)

## 🎯 Key Features

- ✅ Create, read, update, and delete tasks
- ✅ Mark tasks as complete
- ✅ Assign priorities (low, medium, high)
- ✅ Add tags for organization
- ✅ Real-time updates via SSE
- ✅ Progress tracking

## 📝 Next Steps

### To Connect a Real Database:
Update `src/lib/db.ts` with your database driver (PostgreSQL, MongoDB, etc.)

### To Add More Features:
1. Create new components in `src/components/`
2. Add API routes in `src/app/api/`
3. Add type definitions in `src/types/`

### To Deploy:
```bash
npm run build
npm run start
```

Then deploy to Vercel, Netlify, or your preferred hosting.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

Enjoy building SnapTask! 🎉
