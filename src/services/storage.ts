import { Conversation, UserSettings } from '../types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'udits_ai_conversations_v1',
  ACTIVE_ID: 'udits_ai_active_conversation_id',
  SETTINGS: 'udits_ai_settings_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  provider: 'openai',
  model: 'gpt-4o-mini',
  customApiKey: '',
  systemInstruction: '',
  tone: 'balanced',
  language: 'English',
  streamResponse: true,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (e) {
    console.error('Failed to save active conversation id:', e);
  }
}

export function createNewConversation(initialTitle = 'New Chat'): Conversation {
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function exportConversationsToJSON(conversations: Conversation[]): string {
  return JSON.stringify(
    {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      conversations,
    },
    null,
    2
  );
}

export function importConversationsFromJSON(jsonString: string): Conversation[] | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.conversations)) {
      return data.conversations;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
