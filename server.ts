import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Helper to get active OpenAI client
function getOpenAIClient(customKey?: string): OpenAI | null {
  const apiKey = customKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Helper to get active Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Status check API
app.get('/api/status', (_req: Request, res: Response) => {
  const hasEnvOpenAI = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
    process.env.OPENAI_API_KEY.length > 5
  );
  const hasEnvGemini = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.length > 5
  );
  const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  res.json({
    status: 'ok',
    hasEnvOpenAI,
    hasEnvGemini,
    defaultModel,
    brand: "Udit's AI",
    version: '1.0.0',
  });
});

// Test API Key endpoint
app.post('/api/test-key', async (req: Request, res: Response) => {
  const { provider = 'openai', apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
    res.status(400).json({ valid: false, error: 'Please enter a valid API key.' });
    return;
  }

  try {
    if (provider === 'openai') {
      const client = new OpenAI({ apiKey: apiKey.trim() });
      // Lightweight request to verify key
      await client.models.list();
      res.json({ valid: true, message: 'OpenAI API Key verified successfully!' });
      return;
    } else {
      const client = new GoogleGenAI({ apiKey: apiKey.trim() });
      await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Hi',
      });
      res.json({ valid: true, message: 'Gemini API Key verified successfully!' });
      return;
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to authenticate with provider.';
    res.status(401).json({ valid: false, error: errorMsg });
  }
});

// Generate Title for conversation
app.post('/api/generate-title', async (req: Request, res: Response) => {
  const { prompt, customApiKey, provider = 'openai', model = 'gpt-4o-mini' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ title: 'New Conversation' });
    return;
  }

  const promptSnippet = prompt.slice(0, 300);
  const titleInstruction = `Generate a concise 3 to 5 word topic title for this conversation opener. Return ONLY the title, no quotes, no markdown, no trailing punctuation:\n\n"${promptSnippet}"`;

  try {
    const openai = getOpenAIClient(customApiKey);
    if ((provider === 'openai' && openai) || (!getGeminiClient() && openai)) {
      const completion = await openai.chat.completions.create({
        model: model.startsWith('gpt') ? model : 'gpt-4o-mini',
        messages: [{ role: 'user', content: titleInstruction }],
        max_tokens: 20,
        temperature: 0.5,
      });
      const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
      res.json({ title: title || 'New Conversation' });
      return;
    }

    const gemini = getGeminiClient();
    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: titleInstruction,
      });
      const title = response.text?.trim().replace(/^["']|["']$/g, '');
      res.json({ title: title || 'New Conversation' });
      return;
    }

    // Fallback simple truncation
    const fallbackTitle = promptSnippet.split('\n')[0].slice(0, 35).trim() + (promptSnippet.length > 35 ? '...' : '');
    res.json({ title: fallbackTitle || 'New Conversation' });
  } catch {
    const fallbackTitle = promptSnippet.split('\n')[0].slice(0, 35).trim();
    res.json({ title: fallbackTitle || 'New Conversation' });
  }
});

// Chat Streaming API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages = [],
    provider = 'openai',
    model = 'gpt-4o-mini',
    customApiKey,
    systemInstruction,
    attachments = [],
  } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: Record<string, any>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const defaultSystemPrompt = `You are "Udit's AI", a state-of-the-art, highly capable, helpful, and friendly AI assistant.
Tagline: "Think Smarter. Create Faster."
Your mission is to help users learn, code, solve problems, write, create, and build anything.

Capabilities:
- Programming: Write clean, modern, well-commented code in Python, JavaScript/TypeScript, React, HTML/CSS, C++, Java, Go, Rust, SQL, and more. Always explain logic clearly and provide full, working code blocks with language identifiers.
- Education & Science: Explain complex concepts simply, break down mathematics step-by-step, explain STEM topics, history, literature.
- Language & Translation: Fluent in English, Hindi, Hinglish, Spanish, French, and all major languages. Accurately translate and respond in whatever language the user requests.
- Writing & Business: Professional emails, essays, resumes, business models, pitches, creative stories, marketing copy.
- Analysis & Reasoning: Process uploaded data, documents, CSVs, and images thoughtfully.

Formatting Guidelines:
- Use clean Markdown formatting with clear hierarchy (headings, bullet points, bolding).
- Enclose all code in formatted markdown code blocks with syntax names (e.g. \`\`\`python, \`\`\`typescript).
- Be accurate, polite, well-structured, and helpful. If you are unsure of a fact, admit uncertainty rather than hallucinating.`;

  const finalSystemPrompt = systemInstruction?.trim()
    ? `${defaultSystemPrompt}\n\nUser custom instruction/preferences:\n${systemInstruction.trim()}`
    : defaultSystemPrompt;

  const openai = getOpenAIClient(customApiKey);
  const gemini = getGeminiClient();

  // Determine provider:
  // If user selected openai, or if openai client is available:
  const useOpenAI = provider === 'openai' || (!gemini && openai);

  if (useOpenAI) {
    if (!openai) {
      sendEvent({
        error:
          'OpenAI API Key is missing. Please configure OPENAI_API_KEY in the server environment (.env) or enter your key in Settings > API Configuration to start chatting with Udit\'s AI.',
        code: 'OPENAI_KEY_REQUIRED',
      });
      res.end();
      return;
    }

    try {
      // Prepare OpenAI messages
      const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: finalSystemPrompt },
      ];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;

        if (msg.role === 'user') {
          // If message has attachments or is the last message with attachments
          if (isLast && attachments && attachments.length > 0) {
            const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

            // Add text content
            if (msg.content) {
              contentParts.push({ type: 'text', text: msg.content });
            }

            // Append attachments info and images
            for (const att of attachments) {
              if (att.type === 'image' && att.content?.startsWith('data:image')) {
                contentParts.push({
                  type: 'image_url',
                  image_url: { url: att.content },
                });
              } else if (att.content) {
                // Text, CSV, document content
                const fileSnippet = att.content.length > 30000 ? att.content.slice(0, 30000) + '...[truncated]' : att.content;
                contentParts.push({
                  type: 'text',
                  text: `\n\n--- Uploaded File [${att.name}] ---\n${fileSnippet}\n--- End of File ---`,
                });
              }
            }

            formattedMessages.push({
              role: 'user',
              content: contentParts,
            });
          } else {
            formattedMessages.push({
              role: 'user',
              content: msg.content || '',
            });
          }
        } else if (msg.role === 'assistant') {
          formattedMessages.push({
            role: 'assistant',
            content: msg.content || '',
          });
        }
      }

      const activeModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const stream = await openai.chat.completions.create({
        model: activeModel,
        messages: formattedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          sendEvent({ chunk: delta });
        }
      }

      sendEvent({ done: true });
      res.end();
      return;
    } catch (err: any) {
      const errMsg = err?.message || 'OpenAI API encountered an error while processing your request.';
      const statusCode = err?.status || 500;
      let userFriendlyMsg = errMsg;

      if (statusCode === 401 || errMsg.toLowerCase().includes('incorrect api key') || errMsg.toLowerCase().includes('invalid api key')) {
        userFriendlyMsg = 'Authentication failed: Invalid OpenAI API Key. Please verify your OPENAI_API_KEY in the environment or Settings panel.';
      } else if (statusCode === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit')) {
        userFriendlyMsg = 'OpenAI rate limit or quota exceeded. Please check your OpenAI account billing or rate limits, or try again in a few moments.';
      }

      sendEvent({ error: userFriendlyMsg, code: 'OPENAI_ERROR' });
      res.end();
      return;
    }
  }

  // Fallback to Gemini if requested or if only Gemini is available
  if (gemini) {
    try {
      const contents: any[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;
        const role = msg.role === 'assistant' ? 'model' : 'user';

        if (isLast && attachments && attachments.length > 0 && role === 'user') {
          const parts: any[] = [];
          if (msg.content) {
            parts.push({ text: msg.content });
          }

          for (const att of attachments) {
            if (att.type === 'image' && att.content?.startsWith('data:image')) {
              const base64Data = att.content.split(',')[1];
              const mime = att.mimeType || 'image/jpeg';
              parts.push({
                inlineData: { mimeType: mime, data: base64Data },
              });
            } else if (att.content) {
              parts.push({
                text: `\n\n[Uploaded File: ${att.name}]\n${att.content}\n`,
              });
            }
          }
          contents.push({ role, parts });
        } else {
          contents.push({
            role,
            parts: [{ text: msg.content || '' }],
          });
        }
      }

      const responseStream = await gemini.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: finalSystemPrompt,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          sendEvent({ chunk: chunk.text });
        }
      }

      sendEvent({ done: true });
      res.end();
      return;
    } catch (err: any) {
      sendEvent({
        error: err?.message || 'Error occurred communicating with Gemini API.',
        code: 'GEMINI_ERROR',
      });
      res.end();
      return;
    }
  }

  // Neither is configured
  sendEvent({
    error:
      'No AI provider is configured. Please provide your official OpenAI API Key in Settings or set OPENAI_API_KEY in the server environment (.env).',
    code: 'NO_PROVIDER',
  });
  res.end();
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Udit's AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
