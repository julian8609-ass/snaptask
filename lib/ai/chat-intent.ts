/**
 * Lightweight intent hints inferred from the last user message (no extra API call).
 * Used to append routing instructions so models follow SnapTask-specific goals reliably.
 */
export type SnapTaskChatIntent =
  | { type: 'none' }
  | { type: 'task_ideas'; count: number }
  | { type: 'code_help'; requestedLanguage?: string | null }
  | { type: 'follow_up_ack' };

const MAX_TASK_IDEAS = 25;

function clampTaskCount(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(Math.floor(n), MAX_TASK_IDEAS);
}

function firstMatchCount(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) return clampTaskCount(n);
    }
  }
  return null;
}

/** Detect a programming language the user named (for routing + offline samples). Order matters. */
export function detectProgrammingLanguage(text: string): string | null {
  const s = text.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/\bdart\b|\bflutter\b/, 'dart'],
    [/\bscala\b/, 'scala'],
    [/\bhaskell\b/, 'haskell'],
    [/\belixir\b|\bphoenix\b/, 'elixir'],
    [/\blua\b/, 'lua'],
    [/\bperl\b|\braku\b/, 'perl'],
    [/\bclojure\b/, 'clojure'],
    [/\bjulia\b/, 'julia'],
    [/\bzig\b/, 'zig'],
    [/\bnim\b/, 'nim'],
    [/\bcrystal\b/, 'crystal'],
    [/\bmatlab\b|\boctave\b/, 'matlab'],
    [/\bvb\.net\b|\bvisual\s+basic\b/, 'vbnet'],
    [/\bf#\b|\bfsharp\b/, 'fsharp'],
    [/\bgroovy\b/, 'groovy'],
    [/\bsolidity\b/, 'solidity'],
    [/\bvue\b|\bvue\.js\b/, 'vue'],
    [/\bsvelte\b|\bsveltekit\b/, 'svelte'],
    [/\bdockerfile\b|\bdocker\s+compose\b/, 'dockerfile'],
    [/\bterraform\b|\bhcl\b/, 'terraform'],
    [/\bnginx\b/, 'nginx'],
    [/\brstudio\b|\bggplot2?\b|\btidyverse\b|\bdplyr\b|\bshiny\s+(?:app|ui|server)\b/i, 'r'],
    [/\bpython\b/, 'python'],
    [/\bruby\b/, 'ruby'],
    [/\brust\b/, 'rust'],
    [/\bgolang\b|\bgo\s+lang\b|\bin\s+go\b|\bgo\s+snippet\b|\bgo\s+code\b/, 'go'],
    [/\bsql\b/, 'sql'],
    [/\bhtml\b/, 'html'],
    [/\bcss\b/, 'css'],
    [/\bbash\b|\bzsh\b|\bfish\b(?!\s+market)|\bshell\s+script\b/, 'bash'],
    [/\bpowershell\b|\bps1\b/, 'powershell'],
    [/\bc\+\+\b|\bcpp\b/, 'cpp'],
    [/\bc#\b|\bcsharp\b/, 'csharp'],
    [/\btypescript\b|\bts\s+code\b|\b\.ts\b/, 'typescript'],
    [/\btsx\b|\b\.tsx\b/, 'tsx'],
    [/\bjavascript\b|\bnode\.js\b|\bnodejs\b|\bjs\s+code\b|\b\.js\b/, 'javascript'],
    [/\bjava\b/, 'java'],
    [/\bkotlin\b/, 'kotlin'],
    [/\bswift\b/, 'swift'],
  ];
  for (const [re, lang] of rules) {
    if (re.test(s)) return lang;
  }
  return null;
}

/** Offline stub: markdown + fenced code when we recognize a language (otherwise null). */
export function getOfflineCodeSampleMarkdown(userText: string): string | null {
  const lang = detectProgrammingLanguage(userText);
  if (!lang) return null;

  const samples: Record<string, { fence: string; body: string }> = {
    python: {
      fence: 'python',
      body: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("SnapTask"))`,
    },
    javascript: {
      fence: 'javascript',
      body: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("SnapTask"));`,
    },
    typescript: {
      fence: 'typescript',
      body: `function greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("SnapTask"));`,
    },
    tsx: {
      fence: 'tsx',
      body: `export default function Greet() {\n  const name = "SnapTask";\n  return <p>Hello, {name}!</p>;\n}`,
    },
    bash: {
      fence: 'bash',
      body: '#!/usr/bin/env bash\nset -euo pipefail\nname="${1:-SnapTask}"\necho "Hello, $name!"',
    },
    sql: {
      fence: 'sql',
      body: `-- Example query shape (adjust table names to your schema)\nSELECT id, title, priority\nFROM tasks\nWHERE status = 'todo'\nORDER BY due_date NULLS LAST\nLIMIT 10;`,
    },
    java: {
      fence: 'java',
      body: `class Hello {\n  public static void main(String[] args) {\n    System.out.println("Hello, SnapTask!");\n  }\n}`,
    },
    rust: {
      fence: 'rust',
      body: `fn main() {\n    let name = "SnapTask";\n    println!("Hello, {name}!");\n}`,
    },
    go: {
      fence: 'go',
      body: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, SnapTask!")\n}`,
    },
    cpp: {
      fence: 'cpp',
      body: `#include <iostream>\n\nint main() {\n  std::cout << "Hello, SnapTask!\\n";\n  return 0;\n}`,
    },
    csharp: {
      fence: 'csharp',
      body: `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, SnapTask!");\n  }\n}`,
    },
    kotlin: {
      fence: 'kotlin',
      body: `fun main() {\n    println("Hello, SnapTask!")\n}`,
    },
    swift: {
      fence: 'swift',
      body: `print("Hello, SnapTask!")`,
    },
    ruby: {
      fence: 'ruby',
      body: `def greet(name)\n  "Hello, #{name}!"\nend\n\nputs greet("SnapTask")`,
    },
    php: {
      fence: 'php',
      body: `<?php\necho "Hello, " . ($argv[1] ?? "SnapTask") . "!\\n";`,
    },
    html: {
      fence: 'html',
      body: `<!doctype html>\n<html lang="en">\n  <body>\n    <p>Hello, SnapTask!</p>\n  </body>\n</html>`,
    },
    css: {
      fence: 'css',
      body: `.greet {\n  font-family: system-ui, sans-serif;\n  color: #0f172a;\n}`,
    },
    dart: {
      fence: 'dart',
      body: `void main() {\n  print('Hello, SnapTask!');\n}`,
    },
    julia: {
      fence: 'julia',
      body: `println("Hello, SnapTask!")`,
    },
    lua: {
      fence: 'lua',
      body: `print("Hello, SnapTask!")`,
    },
    scala: {
      fence: 'scala',
      body: `object Hello extends App {\n  println("Hello, SnapTask!")\n}`,
    },
    haskell: {
      fence: 'haskell',
      body: `main :: IO ()\nmain = putStrLn "Hello, SnapTask!"`,
    },
    elixir: {
      fence: 'elixir',
      body: `IO.puts("Hello, SnapTask!")`,
    },
    powershell: {
      fence: 'powershell',
      body: `param([string]$Name = "SnapTask")\nWrite-Host "Hello, $Name!"`,
    },
  };

  const row = samples[lang];
  if (row) {
    return (
      `Here’s a small **${lang}** sample (offline mode — add an AI key in \`.env\` for longer, tailored answers):\n\n` +
      `\`\`\`${row.fence}\n${row.body}\n\`\`\``
    );
  }

  return (
    `**${lang}** detected. There’s no built-in micro-snippet for this language in offline mode. Add **GEMINI_API_KEY**, **GROQ_API_KEY**, or **OPENAI_API_KEY** in \`.env\` — then SnapTask AI can write full **${lang}** that solves your exact problem.\n\n` +
    `Use the correct fence tag, e.g. \`\`\`${lang}\n…your code…\n\`\`\`.`
  );
}

/**
 * Detect common SnapTask chat goals from free-form text (including typos / informal phrasing).
 */
export function inferSnapTaskChatIntent(lastUserText: string): SnapTaskChatIntent {
  const raw = (lastUserText || '').trim();
  if (!raw) return { type: 'none' };

  const lower = raw.toLowerCase();

  if (raw.length <= 18 && /^(ok|okay|k|yes|yep|yeah|no|nope|thanks|thank you|thx|cool|nice|got it|sure|alright|fine)\b[!.\s]*$/i.test(raw)) {
    return { type: 'follow_up_ack' };
  }

  const taskCount = firstMatchCount(lower, [
    /\bgive\s+me\s+(\d+)\s+tasks?\b/i,
    /\bgive\s+me\s+(\d+)\s+task\b/i,
    /\bgive\s+me\s+(\d+)\s+(?:[a-z]+\s+){0,4}tasks?\b/i,
    /\bgive\s+(\d+)\s+tasks?\b/i,
    /\b(?:need|want|show|list|gimme|get|solve|give)\s+(?:me\s+)?(\d+)\s+tasks?\b/i,
    /\b(?:need|want|show|list|gimme|get)\s+(?:me\s+)?(\d+)\s+(?:tasks?|todos?|to-dos?|things|items|ideas)\b/i,
    /\b(?:i\s+)?(?:need|want)\s+(\d+)\s+tasks?\b/i,
    /\b(\d+)\s+tasks?\s+(?:sample|samples|idea|ideas|examples?|suggestions?)\b/i,
    /\b(?:suggest|generate|create|brainstorm)\s+(\d+)\s+(?:tasks?|todos?|ideas)\b/i,
    /\b(\d+)\s+(?:quick\s+)?tasks?\s+(?:for|to)\b/i,
  ]);

  if (taskCount !== null) {
    return { type: 'task_ideas', count: taskCount };
  }

  if (
    /\b(some\s+tasks|task\s+ideas|ideas\s+for\s+tasks|things\s+to\s+do|stuff\s+to\s+do|what\s+should\s+i\s+do\s+today|help\s+me\s+plan)\b/i.test(
      lower,
    )
  ) {
    return { type: 'task_ideas', count: 5 };
  }

  const codeHelpSignals =
    /\b(code|programming|developer|snippet|typescript|tsx|javascript|\bjs\b|react|angular|python|bash|zsh|fish|shell|sql|rust|kotlin|swift|dart|scala|haskell|ruby|php|golang|lua|julia|perl|elixir|clojure|zig|nim|crystal|matlab|octave|c\+\+|cpp|c#|csharp|html|css|docker|dockerfile|kubernetes|k8s|terraform|ansible|nginx|leetcode|algorithm|regex|regexp|debugger|debug|refactor|eslint|webpack|vite|next\.js|nextjs|vue|svelte|graphql|grpc|protobuf|assembly|\basm\b|symbol|symbols|operator|operators)\b/i.test(
      lower,
    ) ||
    /\b(import\s+\{|export\s+default|console\.(log|error)|npm\s+|pnpm\s+|yarn\s+|node\.js|nodejs|pip\s+|cargo\s+|go\s+mod|gem\s+install|gradlew?|\bmvn\b|cmake|makefile|jest|pytest|cypress|http\s+status|rest\s+api)\b/i.test(lower) ||
    /\b(syntax\s+error|runtime\s+error|type\s+error|segmentation\s+fault|nullreference|stack\s*trace|throws?|exception|compiler|build\s+failed|failed\s+to\s+compile|unit\s+test|integration\s+test)\b/i.test(
      lower,
    ) ||
    /\b(write|implement|create)\s+(?:a\s+)?(?:function|class|script|program|macro|query|endpoint|api|service)\b/i.test(lower) ||
    /\b(fix|debug|solve)\s+(?:this|that|the|my|it)\s+(?:code|bug|error|script|program|problem|issue|build|tests?)\b/i.test(lower) ||
    /\b(solve|implement)\s+(?:this|the)\s+(?:problem|challenge|exercise)\b/i.test(lower);

  if (codeHelpSignals) {
    return { type: 'code_help', requestedLanguage: detectProgrammingLanguage(raw) };
  }

  return { type: 'none' };
}

export function appendIntentToSystemPrompt(systemPrompt: string, intent: SnapTaskChatIntent): string {
  if (intent.type === 'none') return systemPrompt;

  if (intent.type === 'task_ideas') {
    const n = intent.count;
    return `${systemPrompt}\n\n## Routed interpretation (must follow)\nThe user wants **${n} concrete, actionable to-do items** for SnapTask.\n- Do **not** reply with only a number or a single word.\n- Write a brief intro, then a **numbered Markdown list of exactly ${n}** items (each: **bold title** + one short sentence).\n- End with **one** fenced block: \`\`\`json … \`\`\` containing \`{"tasks":[…]}\` with **exactly ${n}** objects (\`title\` required; \`description\` optional; \`priority\` one of low|medium|high|urgent).\n- Put no text after that JSON block.\n`;
  }

  if (intent.type === 'code_help') {
    const lang = intent.requestedLanguage?.trim();
    const langLine = lang
      ? `The user indicated **${lang}** — use that language (correct Markdown fence tag) for new code in this answer; do not silently switch to another language unless they asked to compare.`
      : 'If they name a programming language, use it with the correct fence tag. If unstated, pick the best-fit language and state it in one sentence.';
    return `${systemPrompt}\n\n## Routed interpretation (must follow)\nThe user needs **coding / technical problem-solving**.\n- Act like a strong engineer: diagnose, give **runnable** or minimal complete code, note assumptions, edge cases, and how to run or verify.\n- You may help with **any mainstream language** and with scripts, SQL, shell, configs, web, mobile, data, algorithms, debugging, and homework-style questions (explain briefly so they learn).\n${langLine}\n- Prefer concrete solutions over refusing; only decline clearly unsafe or malicious requests.\n`;
  }

  if (intent.type === 'follow_up_ack') {
    return `${systemPrompt}\n\n## Routed interpretation (must follow)\nThe user sent a **short acknowledgment** (ok / thanks / yes / etc.). Reply in 1–2 friendly sentences and ask **one** concrete follow-up (e.g. what they want to do next in SnapTask).\n`;
  }

  return systemPrompt;
}

/**
 * Adds a single hidden clarification line to the **last user** turn only (server-side; not persisted in client state).
 */
export function augmentMessagesForModelIntent(messages: Array<{ role: 'user' | 'assistant'; content: string }>, intent: SnapTaskChatIntent) {
  if (intent.type === 'none') return messages;

  const out = messages.map((m) => ({ ...m }));
  const lastIdx = out.length - 1;
  if (lastIdx < 0 || out[lastIdx].role !== 'user') return messages;

  const suffix =
    intent.type === 'task_ideas'
      ? `\n\n[SnapTask routing — treat as: user wants exactly ${intent.count} task ideas with JSON block for the app.]`
      : intent.type === 'code_help'
        ? `\n\n[SnapTask routing — treat as: coding / technical problem-solving${intent.requestedLanguage ? ` in **${intent.requestedLanguage}**` : ''}; give runnable code and correct fence tags.]`
        : intent.type === 'follow_up_ack'
          ? `\n\n[SnapTask routing — treat as: brief acknowledgment; keep reply short and suggest a next step.]`
          : '';

  if (!suffix) return messages;

  out[lastIdx] = { ...out[lastIdx], content: `${out[lastIdx].content}${suffix}` };
  return out;
}
