export type Role = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'text' | 'csv' | 'pdf' | 'docx' | 'other';
  mimeType: string;
  content: string; // Plain text or base64 data URL
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  status?: MessageStatus;
  model?: string;
  attachments?: Attachment[];
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  pinned?: boolean;
}

export type ToneSetting = 'balanced' | 'concise' | 'detailed' | 'code' | 'creative';

export interface UserSettings {
  theme: 'dark' | 'light';
  provider: 'openai' | 'gemini';
  model: string;
  customApiKey: string;
  systemInstruction: string;
  tone: ToneSetting;
  language: string;
  streamResponse: boolean;
}

export interface ServerStatus {
  status: string;
  hasEnvOpenAI: boolean;
  hasEnvGemini: boolean;
  defaultModel: string;
  brand: string;
  version: string;
}
