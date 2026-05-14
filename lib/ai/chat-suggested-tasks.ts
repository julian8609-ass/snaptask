export type SuggestedChatTask = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
};

const ALLOWED: SuggestedChatTask['priority'][] = ['low', 'medium', 'high', 'urgent'];

function normalizePriority(value: unknown): SuggestedChatTask['priority'] {
  const p = String(value || 'medium').toLowerCase();
  if (ALLOWED.includes(p as SuggestedChatTask['priority'])) return p as SuggestedChatTask['priority'];
  return 'medium';
}

/**
 * Finds the last ```json ... ``` block in the assistant message, parses `{ "tasks": [...] }`,
 * and returns display text with that block removed so the user does not see raw JSON.
 */
export function parseSuggestedTasksFromAssistantText(text: string): {
  displayText: string;
  tasks: SuggestedChatTask[];
} {
  const re = /```json\s*([\s\S]*?)```/gi;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) last = m;

  if (!last) return { displayText: text, tasks: [] };

  let parsed: { tasks?: unknown[] };
  try {
    parsed = JSON.parse(last[1].trim()) as { tasks?: unknown[] };
  } catch {
    return { displayText: text, tasks: [] };
  }

  const tasks: SuggestedChatTask[] = [];
  if (parsed?.tasks && Array.isArray(parsed.tasks)) {
    for (const item of parsed.tasks) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      if (!title) continue;
      tasks.push({
        title: title.slice(0, 400),
        description:
          typeof row.description === 'string' && row.description.trim()
            ? row.description.trim().slice(0, 4000)
            : undefined,
        priority: normalizePriority(row.priority),
      });
    }
  }

  if (tasks.length === 0) return { displayText: text, tasks: [] };

  const displayText = (text.slice(0, last.index).trimEnd() + '\n\n' + text.slice(last.index + last[0].length).trimStart())
    .trim();

  return { displayText, tasks };
}
