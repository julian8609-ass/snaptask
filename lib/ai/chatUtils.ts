/**
 * Utilities for non-repetitive AI chat responses.
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * Tokenize text into a set of lowercase words (punctuation stripped).
 */
export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  );
}

/**
 * Jaccard similarity between two text strings (0 = no overlap, 1 = identical).
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((w) => set2.has(w)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Return true when newResponse is too similar to any of the recentReplies.
 */
export function isRepetitive(
  newResponse: string,
  recentReplies: string[],
  threshold = 0.8
): boolean {
  return recentReplies.some(
    (reply) => calculateSimilarity(newResponse, reply) >= threshold
  );
}

/**
 * Extract the most recent AI (assistant) replies from a message array.
 */
export function extractRecentAIReplies(
  messages: ChatMessage[],
  count = 5
): string[] {
  return messages
    .filter((m) => m.role === 'assistant')
    .slice(-count)
    .map((m) => m.content);
}

/**
 * Trim a response to a maximum word count while keeping complete sentences.
 */
export function trimToWordLimit(text: string, maxWords = 200): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();

  // Cut at maxWords and attempt to end on a sentence boundary
  const truncated = words.slice(0, maxWords).join(' ');
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastSentenceEnd > truncated.length * 0.6) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }

  return truncated + '…';
}
