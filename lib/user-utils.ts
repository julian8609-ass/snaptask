/**
 * Generate a consistent demo user ID
 * Uses a fixed UUID so the same user is used across sessions
 */

export function getDemoUserId(): string {
  const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  
  // Check if a real userId is stored in localStorage
  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  
  if (storedUserId && storedUserId !== 'demo-user') {
    return storedUserId;
  }
  
  // Use consistent demo UUID
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', DEMO_USER_ID);
  }
  
  return DEMO_USER_ID;
}

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
