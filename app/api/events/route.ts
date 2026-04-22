import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Create a readable stream for SSE
  const readable = new ReadableStream({
    async start(controller) {
      // Send initial task list
      try {
        const tasks = await db.tasks.getAll();
        controller.enqueue(
          `data: ${JSON.stringify({ type: 'initial', tasks })}\n\n`
        );
      } catch (error) {
        console.error('Failed to send initial tasks:', error);
      }

      // Subscribe to task changes
      const unsubscribe = db.subscribe(async () => {
        try {
          const tasks = await db.tasks.getAll();
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'update', tasks })}\n\n`
          );
        } catch (error) {
          console.error('Failed to send task update:', error);
        }
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new NextResponse(readable, { headers });
}
