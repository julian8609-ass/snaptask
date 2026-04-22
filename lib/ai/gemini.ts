import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task, AIMetadata, AISuggestion } from '@/types';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const client = new GoogleGenerativeAI(apiKey);

const model = client.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
  systemInstruction: `You are an AI assistant for a modern to-do list application. Your role is to:
1. Analyze task descriptions and suggest priorities
2. Identify implicit deadlines or time references in natural language
3. Suggest subtasks for complex tasks
4. Auto-categorize tasks into tags
5. Estimate task completion times
6. Generate reminders based on urgency

Respond with valid JSON only. Never include markdown formatting or extra text outside JSON.`
});

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
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis: TaskAnalysisResponse = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing task:', error);
    // Return default response on error
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
