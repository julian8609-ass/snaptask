# Claude Chat System Setup

## Environment Setup

Add this to your `.env.local` file:

```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Get your Claude API key from: https://console.anthropic.com/

## Installation

Install the Anthropic package:

```bash
npm install @anthropic-ai/sdk
```

## Usage

1. Navigate to: http://localhost:3000/chat
2. Start typing messages to interact with the AI
3. Messages are automatically saved to browser localStorage
4. Clear chat history using the delete button in the header

## Files Created

- `/app/api/chat/route.ts` - Backend API for Claude integration
- `/app/chat/page.tsx` - Frontend chat UI component

## Features

✅ Chat messages with user/assistant roles
✅ Auto-scrolling to latest messages
✅ Loading state ("Thinking...")
✅ Error handling with user feedback
✅ Message history persistence (localStorage)
✅ Clean Material-UI design
✅ Support for multi-line input (Shift+Enter)
✅ Keyboard shortcut (Enter to send)
✅ Clear chat history button

## Security

- OpenAI API key is kept server-side only
- Never exposed to the client
- Messages are stored locally in browser (not sent to server for persistence)

## Model Configuration

The API uses:
- Model: `claude-3-5-sonnet-20241022`
- Temperature: 0.3 (more accurate, less random)
- Max tokens: 700

To use a different Claude model, change `ANTHROPIC_MODEL` in `.env.local`.

## Troubleshooting

**"Claude API key is not configured"**
- Add `ANTHROPIC_API_KEY` to `.env.local`
- Restart the dev server

**Network errors**
- Check your Anthropic account has available credits
- Verify API key is valid at https://console.anthropic.com/

**Messages not saving**
- Check browser localStorage is enabled
- Open DevTools → Application → Local Storage
