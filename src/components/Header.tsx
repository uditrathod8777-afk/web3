import React from 'react';
import { Menu, Plus, Settings, Sparkles, Cpu } from 'lucide-react';
import { Conversation, UserSettings, ServerStatus } from '../types/chat';

interface HeaderProps {
  activeConversation: Conversation | null;
  settings: UserSettings;
  serverStatus: ServerStatus | null;
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeConversation,
  settings,
  serverStatus,
  onOpenMobileSidebar,
  onNewChat,
  onOpenSettings,
}) => {
  const isDark = settings.theme === 'dark';

  // Format model label
  const modelDisplayName = (() => {
    if (settings.provider === 'openai') {
      if (settings.model === 'gpt-4o') return 'GPT-4o';
      if (settings.model === 'gpt-4o-mini') return 'GPT-4o Mini';
      if (settings.model === 'o1-mini') return 'o1 Mini';
      return settings.model || 'GPT-4o Mini';
    }
    return 'Gemini 3.8 Flash';
  })();

  const hasKey =
    Boolean(settings.customApiKey?.trim()) ||
    (settings.provider === 'openai' && serverStatus?.hasEnvOpenAI) ||
    (settings.provider === 'gemini' && serverStatus?.hasEnvGemini);

  return (
    <header
      className={`h-14 px-4 flex items-center justify-between gap-8 border-b transition-colors shrink-0 ${
        isDark
          ? 'bg-[#0b0f17]/95 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
      }`}
    >
      {/* Zone 1: Mobile toggle + Breadcrumb / Active conversation title */}
      <div className="flex items-center gap-3 truncate shrink-0 max-w-xs md:max-w-md">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 -ml-1 rounded-md text-slate-400 hover:text-white md:hidden"
          title="Open chat list"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-sm whitespace-nowrap">Udit's AI</span>
          <span className="text-slate-500" aria-hidden="true">
            /
          </span>
          <span className="text-xs text-slate-400 truncate">
            {activeConversation?.title || 'New Conversation'}
          </span>
        </div>
      </div>

      {/* Zone 2: Model Indicator & Provider status */}
      <div className="hidden sm:flex items-center gap-4 text-xs">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
          title="Click to configure model and provider in Settings"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium whitespace-nowrap">{modelDisplayName}</span>
          <span className="text-slate-500" aria-hidden="true">
            ·
          </span>
          <span
            className={`text-[11px] whitespace-nowrap ${
              hasKey ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {hasKey ? 'Ready' : 'Setup Key'}
          </span>
        </button>
      </div>

      {/* Zone 3: Primary actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewChat}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline whitespace-nowrap">New Chat</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
