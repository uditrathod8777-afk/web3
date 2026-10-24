import { Message, ServerStatus, Attachment } from '../types/chat';

export async function fetchServerStatus(): Promise<ServerStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch server status');
    return await res.json();
  } catch (e: any) {
    return {
      status: 'error',
      hasEnvOpenAI: false,
      hasEnvGemini: false,
      defaultModel: 'gpt-4o-mini',
      brand: "Udit's AI",
      version: '1.0.0',
    };
  }
}

export async function testApiKey(
  apiKey: string,
  provider: 'openai' | 'gemini' = 'openai'
): Promise<{ valid: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data.error || 'Failed to validate API key.' };
    }
    return data;
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error while validating key.' };
  }
}

export async function generateConversationTitle(
  firstPrompt: string,
  options?: {
    customApiKey?: string;
    provider?: 'openai' | 'gemini';
    model?: string;
  }
): Promise<string> {
  try {
    const res = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: firstPrompt,
        customApiKey: options?.customApiKey,
        provider: options?.provider || 'openai',
        model: options?.model || 'gpt-4o-mini',
      }),
    });
    if (!res.ok) return firstPrompt.slice(0, 30);
    const data = await res.json();
    return data.title || firstPrompt.slice(0, 30);
  } catch {
    return firstPrompt.slice(0, 30);
  }
}

export interface StreamChatParams {
  messages: Message[];
  provider: 'openai' | 'gemini';
  model: string;
  customApiKey?: string;
  systemInstruction?: string;
  attachments?: Attachment[];
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function streamChatCompletion({
  messages,
  provider,
  model,
  customApiKey,
  systemInstruction,
  attachments,
  signal,
  onChunk,
  onError,
  onDone,
}: StreamChatParams): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        provider,
        model,
        customApiKey,
        systemInstruction,
        attachments,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const json = JSON.parse(errorText);
        onError(json.error || `HTTP ${response.status}: Failed to reach chat service.`);
      } catch {
        onError(`Server returned error ${response.status}: ${errorText || response.statusText}`);
      }
      return;
    }

    if (!response.body) {
      onError('No response stream received from server.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.done) {
              onDone();
              return;
            }
          } catch {
            // Ignore malformed partial chunks
          }
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone();
      return;
    }
    onError(err.message || 'An unexpected connection error occurred.');
  }
}
