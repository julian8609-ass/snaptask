import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { Task, AISuggestion } from '@/types';
import { generateSnapTaskChatReply, getGeminiKeyForServer, getGeminiModelId } from '@/lib/ai/chat-completion';
import { buildSnapTaskChatSystemPrompt } from '@/lib/ai/chat-prompts';

const JSON_TASK_SYSTEM = `You are an AI assistant for a modern to-do list application. Your role is to:
1. Analyze task descriptions and suggest priorities
2. Identify implicit deadlines or time references in natural language
3. Suggest subtasks for complex tasks
4. Auto-categorize tasks into tags
5. Estimate task completion times
6. Generate reminders based on urgency

Respond with valid JSON only. Never include markdown formatting or extra text outside JSON.`;

let cachedJsonModel: GenerativeModel | null | undefined;
function getJsonTaskModel(): GenerativeModel | null {
  if (cachedJsonModel !== undefined) return cachedJsonModel;
  const key = getGeminiKeyForServer();
  if (!key) {
    cachedJsonModel = null;
    return null;
  }
  const genAI = new GoogleGenerativeAI(key);
  cachedJsonModel = genAI.getGenerativeModel({
    model: getGeminiModelId(),
    systemInstruction: JSON_TASK_SYSTEM,
  });
  return cachedJsonModel;
}

let cachedPlainModel: GenerativeModel | null | undefined;
function getPlainModel(): GenerativeModel | null {
  if (cachedPlainModel !== undefined) return cachedPlainModel;
  const key = getGeminiKeyForServer();
  if (!key) {
    cachedPlainModel = null;
    return null;
  }
  const genAI = new GoogleGenerativeAI(key);
  cachedPlainModel = genAI.getGenerativeModel({ model: getGeminiModelId() });
  return cachedPlainModel;
}

export interface TaskAnalysisResponse {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  suggested_subtasks?: Array<{ title: string; description?: string }>;
  extracted_datetime?: string;
  estimated_hours?: number;
  confidence_score: number;
  ai_suggestions?: AISuggestion[];
}

/**
 * Analyze a task using Google Gemini AI
 */
export async function analyzeTask(
  taskTitle: string,
  taskDescription?: string
): Promise<TaskAnalysisResponse> {
  const model = getJsonTaskModel();
  if (!model) {
    return {
      priority: 'medium',
      category: 'Other',
      tags: [],
      estimated_hours: 1,
      confidence_score: 0.5,
    };
  }
  try {
    const prompt = `Analyze this task and provide structured suggestions in JSON format:

Task Title: "${taskTitle}"
${taskDescription ? `Task Description: "${taskDescription}"` : ''}

Return a JSON object with ONLY these fields (no markdown, no extra text):
{
  "priority": "low|medium|high|urgent",
  "category": "Work|Personal|Shopping|Health|Finance|Education|Other",
  "tags": ["tag1", "tag2"],
  "suggested_subtasks": [{"title": "subtask", "description": "optional"}],
  "extracted_datetime": "ISO string or null if not found",
  "estimated_hours": number,
  "confidence_score": 0-1,
  "ai_suggestions": [{"type": "subtask|priority|deadline|category", "content": "suggestion", "confidence": 0-1}]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis: TaskAnalysisResponse = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing task:', error);
    return {
      priority: 'medium',
      category: 'Other',
      tags: [],
      estimated_hours: 1,
      confidence_score: 0.5,
    };
  }
}

/**
 * Generate task suggestions based on user input
 */
export async function generateTaskSuggestions(userInput: string): Promise<string[]> {
  const model = getJsonTaskModel();
  if (!model) return [];
  try {
    const prompt = `Given this natural language input about a task: "${userInput}"

Generate 3-5 specific, actionable task suggestions that the user might want to create.
Return ONLY a JSON array of strings with task suggestions, no markdown:
["task1", "task2", "task3"]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const suggestions: string[] = JSON.parse(jsonMatch[0]);
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}

/**
 * Calculate reminder urgency based on task
 */
export async function calculateReminderUrgency(task: Task): Promise<number> {
  const model = getJsonTaskModel();
  if (!model) return 50;
  try {
    const prompt = `Based on this task, calculate urgency level (0-100):
Title: "${task.title}"
Priority: ${task.priority}
Due Date: ${task.due_date || 'None'}
Status: ${task.status}
Description: ${task.description || 'None'}

Return ONLY a JSON object with a single "urgency" number (0-100):
{"urgency": 75}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return 50;
    }

    const response: { urgency: number } = JSON.parse(jsonMatch[0]);
    return Math.min(100, Math.max(0, response.urgency));
  } catch (error) {
    console.error('Error calculating urgency:', error);
    return 50;
  }
}

/**
 * Generate personalized reminders
 */
export async function generateReminderText(task: Task): Promise<string> {
  const model = getJsonTaskModel();
  if (!model) return `Reminder: ${task.title}`;
  try {
    const prompt = `Generate a concise, personalized reminder message for this task (max 100 chars):
Title: "${task.title}"
Priority: ${task.priority}
Due: ${task.due_date || 'No specific date'}

Return ONLY a JSON object:
{"reminder": "Your reminder text here"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return `Reminder: ${task.title}`;
    }

    const response: { reminder: string } = JSON.parse(jsonMatch[0]);
    return response.reminder;
  } catch (error) {
    console.error('Error generating reminder:', error);
    return `Reminder: ${task.title}`;
  }
}

/**
 * Chat response interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  message: string;
  detectedTask?: ExtractedTask | null;
  suggestions?: string[];
}

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  category?: string;
  tags?: string[];
  confidence: number;
}

/**
 * Send a chat message and get AI response
 * Maintains conversation context for better responses
 */
export async function chatWithAssistant(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    const recentMessages = conversationHistory.slice(-10);
    const turns = [...recentMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })), { role: 'user' as const, content: userMessage }];

    const { text: assistantMessage } = await generateSnapTaskChatReply({
      messages: turns,
      systemPrompt: buildSnapTaskChatSystemPrompt(),
    });

    const extractedTask = await detectAndExtractTask(userMessage);

    return {
      message: assistantMessage,
      detectedTask: extractedTask,
      suggestions: extractedTask ? undefined : undefined,
    };
  } catch (error) {
    console.error('Error in chat:', error);
    return {
      message: "I'm having trouble right now. Could you try again?",
      detectedTask: null,
    };
  }
}

/**
 * Detect if user message contains a task request and extract task details
 */
export async function detectAndExtractTask(userMessage: string): Promise<ExtractedTask | null> {
  const model = getPlainModel();
  if (!model) return null;
  try {
    const taskKeywords = [
      'remind',
      'task',
      'todo',
      'need',
      'must',
      'should',
      'schedule',
      'plan',
      'finish',
      'complete',
      'do',
      'create',
      'add',
    ];

    const messageLC = userMessage.toLowerCase();
    const hasTaskKeyword = taskKeywords.some((keyword) => messageLC.includes(keyword));

    if (!hasTaskKeyword) {
      return null;
    }

    const prompt = `Analyze this user message and determine if they want to create a task.

Message: "${userMessage}"

If this is a task creation request, extract the details and return JSON:
{
  "isTask": true,
  "title": "Task title (required)",
  "description": "Task description (optional)",
  "priority": "low|medium|high|urgent",
  "dueDate": "ISO date string or null",
  "category": "Work|Personal|Shopping|Health|Finance|Education|Other",
  "tags": ["tag1", "tag2"],
  "confidence": 0.0-1.0
}

If NOT a task request, return:
{
  "isTask": false,
  "confidence": 0.0-1.0
}

ONLY return valid JSON, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);

    if (analysis.isTask && analysis.confidence > 0.6) {
      return {
        title: analysis.title || 'Untitled Task',
        description: analysis.description,
        priority: analysis.priority || 'medium',
        dueDate: analysis.dueDate,
        category: analysis.category || 'Other',
        tags: analysis.tags || [],
        confidence: analysis.confidence,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting task:', error);
    return null;
  }
}

/**
 * Generate task suggestions based on user's stated goals
 */
export async function suggestTasksFromGoal(goal: string): Promise<ExtractedTask[]> {
  const model = getPlainModel();
  if (!model) return [];
  try {
    const prompt = `The user wants to: "${goal}"

Generate 3-5 specific, actionable task suggestions broken down into smaller steps.
Return ONLY a JSON array of tasks:
[
  {
    "title": "task title",
    "description": "brief description",
    "priority": "low|medium|high",
    "category": "Work|Personal|...",
    "tags": ["tag1"],
    "confidence": 0.9
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const suggestions: ExtractedTask[] = JSON.parse(jsonMatch[0]);
    return suggestions;
  } catch (error) {
    console.error('Error suggesting tasks:', error);
    return [];
  }
}

/**
 * Generate daily AI summary of tasks and recommendations
 */
export async function generateDailySummary(tasks: Task[]): Promise<string> {
  const model = getPlainModel();
  if (!model) return 'Have a productive day! Focus on your most important tasks.';
  try {
    const tasksSummary = tasks
      .slice(0, 5)
      .map((t) => `- ${t.title} (${t.priority} priority)`)
      .join('\n');

    const prompt = `Here are today's tasks:
${tasksSummary}

Generate a brief, motivational daily summary with prioritization advice (max 150 chars):`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Have a productive day! Focus on your most important tasks.';
  }
}
