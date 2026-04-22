import { NextResponse } from 'next/server';

async function callOpenAIChat(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('OPENAI_API_KEY is not set.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const json = await response.json();
    return json?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const response = await callOpenAIChat(prompt);

    if (!response) {
      return NextResponse.json({ error: 'Failed to get a response from AI.' }, { status: 500 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}