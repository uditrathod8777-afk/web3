import React, { useState } from 'react';
import {
  X,
  Key,
  Sliders,
  Moon,
  Sun,
  Globe,
  Trash2,
  Download,
  Upload,
  Check,
  AlertCircle,
  Cpu,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UserSettings, ToneSetting, ServerStatus, Conversation } from '../types/chat';
import { testApiKey, fetchServerStatus } from '../services/api';
import { exportConversationsToJSON, importConversationsFromJSON } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  serverStatus: ServerStatus | null;
  conversations: Conversation[];
  onClearAllHistory: () => void;
  onImportConversations: (imported: Conversation[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  serverStatus,
  conversations,
  onClearAllHistory,
  onImportConversations,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'data'>('ai');
  const [keyInput, setKeyInput] = useState(settings.customApiKey || '');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid?: boolean; message?: string; error?: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleSaveKey = () => {
    onUpdateSettings({ customApiKey: keyInput.trim() });
    setTestResult({ valid: true, message: 'API key saved to this browser session.' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestKey = async () => {
    const keyToTest = keyInput.trim() || (settings.provider === 'openai' ? '' : '');
    if (!keyToTest) {
      setTestResult({ error: 'Please enter an API key to test.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    const result = await testApiKey(keyToTest, settings.provider);
    setIsTestingKey(false);
    setTestResult(result);
  };

  const handleExportData = () => {
    const jsonStr = exportConversationsToJSON(conversations);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `udits_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = importConversationsFromJSON(content);
      if (parsed && parsed.length > 0) {
        onImportConversations(parsed);
        setImportStatus(`Successfully imported ${parsed.length} conversations.`);
      } else {
        setImportStatus('Invalid backup file. Could not parse conversations.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toneOptions: { id: ToneSetting; label: string; desc: string }[] = [
    { id: 'balanced', label: 'Balanced', desc: 'Clear, direct, and helpful explanations.' },
    { id: 'concise', label: 'Concise', desc: 'Straight to the point with minimal fluff.' },
    { id: 'detailed', label: 'Detailed', desc: 'In-depth, comprehensive step-by-step guidance.' },
    { id: 'code', label: 'Code Specialist', desc: 'Focuses on production-grade code, types, and logic.' },
    { id: 'creative', label: 'Creative', desc: 'Brainstorming, expressive writing, and fresh ideas.' },
  ];

  const languageOptions = [
    'English',
    'Hindi (हिन्दी)',
    'Hinglish (Hindi in Latin script)',
    'Spanish (Español)',
    'French (Français)',
    'German (Deutsch)',
    'Japanese (日本語)',
    'Chinese (中文)',
    'Arabic (العربية)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              UAI
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Settings</h2>
              <p className="text-xs text-slate-400">Configure Udit's AI preferences and models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 px-6 gap-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Engine & Keys
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preferences & Tone
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'data'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chat History & Data
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  AI Model & Engine
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ provider: 'openai', model: 'gpt-4o-mini' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.provider === 'openai' && settings.model === 'gpt-4o-mini'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">GPT-4o Mini (Default)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        Fast
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Official OpenAI model. Ideal for coding, math, reasoning, and high speed.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ provider: 'openai', model: 'gpt-4o' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.provider === 'openai' && settings.model === 'gpt-4o'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">GPT-4o (Omni)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                        Flagship
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Highest intelligence OpenAI model for advanced software architecture and deep STEM.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ provider: 'gemini', model: 'gemini-3.8-flash' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.provider === 'gemini'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">Gemini 3.8 Flash</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                        Multi-modal
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Google GenAI engine. Pre-configured and ultra-responsive.
                    </p>
                  </button>
                </div>
              </div>

              {/* API Key Configuration */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">OpenAI API Key</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      serverStatus?.hasEnvOpenAI
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {serverStatus?.hasEnvOpenAI ? 'Env key active' : 'Custom key optional'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Udit's AI securely routes requests through the server. If{' '}
                  <code className="text-indigo-300 font-mono">OPENAI_API_KEY</code> is set in your
                  server environment, it is automatically used. You can also provide your own personal
                  key below:
                </p>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={
                        serverStatus?.hasEnvOpenAI
                          ? 'Using server OPENAI_API_KEY (leave empty or override)'
                          : 'sk-proj-...'
                      }
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveKey}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                      >
                        Save Key
                      </button>
                      {keyInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setKeyInput('');
                            onUpdateSettings({ customApiKey: '' });
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          Clear Key
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {isTestingKey ? 'Verifying...' : 'Test Connection'}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                        testResult.valid
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-200'
                      }`}
                    >
                      {testResult.valid ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>{testResult.message || testResult.error}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Response Tone & Persona
                </label>
                <div className="space-y-2">
                  {toneOptions.map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => onUpdateSettings({ tone: opt.id })}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        settings.tone === opt.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        checked={settings.tone === opt.id}
                        onChange={() => onUpdateSettings({ tone: opt.id })}
                        className="mt-1 text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Preferred Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={settings.language}
                    onChange={(e) => onUpdateSettings({ language: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white outline-hidden focus:border-indigo-500"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Udit's AI will prioritize answering in this language unless specified otherwise in your prompt.
                </p>
              </div>

              {/* Custom System Instruction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={settings.systemInstruction}
                  onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
                  placeholder="e.g. Always format answers with TypeScript code, or keep answers concise and friendly..."
                  rows={3}
                  className="w-full p-3 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-5">
              {/* Export / Import */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                <h3 className="text-xs font-semibold text-white">Backup & Restore Conversations</h3>
                <p className="text-xs text-slate-400">
                  Export all your saved conversations into a portable JSON backup file, or restore from a
                  previous backup.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={conversations.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {conversations.length} Chats (JSON)</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Chats</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs text-indigo-400 font-medium">{importStatus}</p>
                )}
              </div>

              {/* Clear All History */}
              <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-3">
                <h3 className="text-xs font-semibold text-rose-300">Danger Zone: Clear History</h3>
                <p className="text-xs text-slate-400">
                  This permanently removes all saved conversation threads and messages from this browser.
                </p>

                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Conversations</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300 font-semibold">Are you completely sure?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllHistory();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Udit's AI v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
