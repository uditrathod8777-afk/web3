/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  UserSettings,
  ServerStatus,
} from './types/chat';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  createNewConversation,
  loadSettings,
  saveSettings,
} from './services/storage';
import {
  fetchServerStatus,
  generateConversationTitle,
  streamChatCompletion,
} from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = loadConversations();
    if (saved.length > 0) return saved;
    const initial = createNewConversation('New Chat');
    return [initial];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const savedId = loadActiveConversationId();
    if (savedId) return savedId;
    return conversations[0]?.id || null;
  });

  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync conversations to storage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Sync active id to storage
  useEffect(() => {
    saveActiveConversationId(activeConversationId);
  }, [activeConversationId]);

  // Sync settings to storage & html class
  useEffect(() => {
    saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Load server status
  useEffect(() => {
    fetchServerStatus().then((status) => {
      setServerStatus(status);
      // If server has OpenAI env key and provider not set to gemini, default to openai
      if (status.hasEnvOpenAI && settings.provider === 'openai') {
        setSettings((prev) => ({
          ...prev,
          model: prev.model || status.defaultModel || 'gpt-4o-mini',
        }));
      }
    });
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  // New Chat
  const handleNewChat = useCallback(() => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }
    const newConv = createNewConversation('New Chat');
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, [isGenerating]);

  // Keyboard shortcuts (Cmd/Ctrl + N for new chat, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsHelpOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    if (isGenerating && activeConversationId === id) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }

    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createNewConversation('New Chat');
        setActiveConversationId(fresh.id);
        return [fresh];
      }
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Clear all conversations
  const handleClearAllHistory = () => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }
    const fresh = createNewConversation('New Chat');
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
  };

  // Import conversations
  const handleImportConversations = (imported: Conversation[]) => {
    setConversations((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newItems = imported.filter((c) => !existingIds.has(c.id));
      const combined = [...newItems, ...prev];
      if (combined.length > 0 && !activeConversationId) {
        setActiveConversationId(combined[0].id);
      }
      return combined;
    });
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send message
  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
      status: 'complete',
    };

    const assistantMessageId = `msg_a_${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
      model: settings.model,
    };

    const isFirstMessage = activeConversation.messages.length === 0;

    // Update conversation state with user message and pending assistant message
    const updatedMessages = [...activeConversation.messages, userMessage, initialAssistantMessage];
    const currentConvId = activeConversation.id;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Auto generate title on first message
    if (isFirstMessage && text) {
      generateConversationTitle(text, {
        customApiKey: settings.customApiKey,
        provider: settings.provider,
        model: settings.model,
      }).then((title) => {
        if (title) {
          handleRenameConversation(currentConvId, title);
        }
      });
    }

    // Build system prompt adjustments based on tone and language
    let toneInstruction = '';
    if (settings.tone === 'concise') {
      toneInstruction = 'Keep responses concise, crisp, and direct with minimal preamble.';
    } else if (settings.tone === 'detailed') {
      toneInstruction = 'Provide exhaustive, in-depth explanations with step-by-step logic and clear examples.';
    } else if (settings.tone === 'code') {
      toneInstruction = 'Focus heavily on high-quality, production-ready code blocks, type safety, and technical accuracy.';
    } else if (settings.tone === 'creative') {
      toneInstruction = 'Adopt an inventive, imaginative, and engaging tone for brainstorming and writing.';
    }

    const fullInstruction = [
      settings.systemInstruction,
      toneInstruction,
      settings.language && settings.language !== 'English'
        ? `Respond in ${settings.language} unless the user explicitly requests another language.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Stream completion
    await streamChatCompletion({
      messages: [...activeConversation.messages, userMessage],
      provider: settings.provider,
      model: settings.model,
      customApiKey: settings.customApiKey,
      systemInstruction: fullInstruction,
      attachments,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: m.content + chunk,
                  status: 'streaming' as const,
                };
              }
              return m;
            });
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );
      },
      onError: (errMsg) => {
        setIsGenerating(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  status: 'error' as const,
                  error: errMsg,
                };
              }
              return m;
            });
            return { ...c, messages: msgs };
          })
        );
      },
      onDone: () => {
        setIsGenerating(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  status: 'complete' as const,
                };
              }
              return m;
            });
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );
      },
    });
  };

  // Regenerate Response
  const handleRegenerateResponse = async (assistantMessageIndex: number) => {
    if (!activeConversation || isGenerating) return;

    // The user message is the message immediately before
    const userMsgIndex = assistantMessageIndex - 1;
    if (userMsgIndex < 0) return;

    const userMessage = activeConversation.messages[userMsgIndex];
    if (userMessage.role !== 'user') return;

    // Truncate messages up to the user message
    const previousMessages = activeConversation.messages.slice(0, userMsgIndex);
    const assistantMessageId = `msg_a_${Date.now()}`;
    const newAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
      model: settings.model,
    };

    const currentConvId = activeConversation.id;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? {
              ...c,
              messages: [...previousMessages, userMessage, newAssistantMessage],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    await streamChatCompletion({
      messages: [...previousMessages, userMessage],
      provider: settings.provider,
      model: settings.model,
      customApiKey: settings.customApiKey,
      systemInstruction: settings.systemInstruction,
      attachments: userMessage.attachments,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: m.content + chunk,
                  status: 'streaming' as const,
                };
              }
              return m;
            });
            return { ...c, messages: msgs };
          })
        );
      },
      onError: (errMsg) => {
        setIsGenerating(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  status: 'error' as const,
                  error: errMsg,
                };
              }
              return m;
            });
            return { ...c, messages: msgs };
          })
        );
      },
      onDone: () => {
        setIsGenerating(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  status: 'complete' as const,
                };
              }
              return m;
            });
            return { ...c, messages: msgs };
          })
        );
      },
    });
  };

  // Retry failed user prompt
  const handleRetryMessage = (failedMessageIndex: number) => {
    // If it's an assistant message with error, find the previous user message
    const targetIndex =
      activeConversation?.messages[failedMessageIndex]?.role === 'assistant'
        ? failedMessageIndex
        : failedMessageIndex + 1;
    handleRegenerateResponse(targetIndex);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        settings.theme === 'dark' ? 'dark bg-[#0b0f17] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        settings={settings}
        onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Layout */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          activeConversation={activeConversation}
          settings={settings}
          serverStatus={serverStatus}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <ChatView
          conversation={activeConversation}
          settings={settings}
          isGenerating={isGenerating}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onRegenerateResponse={handleRegenerateResponse}
          onRetryMessage={handleRetryMessage}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
        serverStatus={serverStatus}
        conversations={conversations}
        onClearAllHistory={handleClearAllHistory}
        onImportConversations={handleImportConversations}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        settings={settings}
      />
    </div>
  );
}
