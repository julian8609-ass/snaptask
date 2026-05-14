// Database setup and utilities
// Local file-backed store for demo purposes.
// This provides a shared fallback across Next.js worker processes.

import fs from 'fs';
import path from 'path';
import { Task, User, Reminder } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'local-db.json');

type LocalDB = {
  tasks: Task[];
  users: User[];
  reminders: Reminder[];
};

const INITIAL_DB: LocalDB = {
  tasks: [],
  users: [],
  reminders: [],
};

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
  }
}

function readDb(): LocalDB {
  ensureDbFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as LocalDB;
  } catch (error) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    return { ...INITIAL_DB };
  }
}

function writeDb(db: LocalDB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

const taskSubscribers: Set<() => void> = new Set();

export const db = {
  tasks: {
    create: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const dbState = readDb();
      const id = Date.now().toString();
      const newTask: Task = {
        ...task,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbState.tasks.push(newTask);
      writeDb(dbState);
      notifySubscribers();
      return newTask;
    },

    getAll: async (): Promise<Task[]> => {
      const dbState = readDb();
      return dbState.tasks;
    },

    getById: async (id: string): Promise<Task | null> => {
      const dbState = readDb();
      return dbState.tasks.find((task) => task.id === id) || null;
    },

    update: async (id: string, updates: Partial<Task>): Promise<Task | null> => {
      const dbState = readDb();
      const index = dbState.tasks.findIndex((task) => task.id === id);
      if (index === -1) return null;

      const updated: Task = {
        ...dbState.tasks[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      dbState.tasks[index] = updated;
      writeDb(dbState);
      notifySubscribers();
      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      const dbState = readDb();
      const index = dbState.tasks.findIndex((task) => task.id === id);
      if (index === -1) return false;
      dbState.tasks.splice(index, 1);
      writeDb(dbState);
      notifySubscribers();
      return true;
    },
  },

  users: {
    create: async (user: Omit<User, 'id'>) => {
      const dbState = readDb();
      const id = Date.now().toString();
      const newUser: User = { ...user, id };
      dbState.users.push(newUser);
      writeDb(dbState);
      return newUser;
    },

    getAll: async (): Promise<User[]> => {
      const dbState = readDb();
      return dbState.users;
    },

    getById: async (id: string): Promise<User | null> => {
      const dbState = readDb();
      return dbState.users.find((user) => user.id === id) || null;
    },
  },

  reminders: {
    create: async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
      const dbState = readDb();
      const id = Date.now().toString();
      const newReminder: Reminder = {
        ...reminder,
        id,
        created_at: new Date().toISOString(),
      };
      dbState.reminders.push(newReminder);
      writeDb(dbState);
      return newReminder;
    },

    getByUser: async (userId: string): Promise<Reminder[]> => {
      const dbState = readDb();
      return dbState.reminders.filter(
        (reminder) => reminder.user_id === userId && !reminder.is_sent
      );
    },

    markAsSent: async (reminderId: string): Promise<boolean> => {
      const dbState = readDb();
      const index = dbState.reminders.findIndex((reminder) => reminder.id === reminderId);
      if (index === -1) return false;
      dbState.reminders[index] = { ...dbState.reminders[index], is_sent: true };
      writeDb(dbState);
      return true;
    },
  },

  // Subscribe to task changes for real-time updates
  subscribe: (callback: () => void) => {
    taskSubscribers.add(callback);
    return () => taskSubscribers.delete(callback);
  },
};

function notifySubscribers() {
  taskSubscribers.forEach((callback) => callback());
}

export default db;
