import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  X,
  Copy,
  Check,
  RotateCcw,
  Square,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Bot,
  User,
  Trash2,
  Code2,
  BookOpen,
  Calculator,
  Languages,
  Lightbulb,
  Globe,
} from 'lucide-react';
import { Conversation, Message, Attachment, UserSettings } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { processUploadedFile, formatBytes } from '../utils/fileParser';

interface ChatViewProps {
  conversation: Conversation | null;
  settings: UserSettings;
  isGenerating: boolean;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopGeneration: () => void;
  onRegenerateResponse: (messageIndex: number) => void;
  onRetryMessage: (userMessageIndex: number) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: Sparkles,
    label: 'Explain artificial intelligence in simple words.',
    category: 'Education',
  },
  {
    icon: Code2,
    label: 'Write a Python program to calculate factorial.',
    category: 'Programming',
  },
  {
    icon: Globe,
    label: 'Help me build a professional website.',
    category: 'Development',
  },
  {
    icon: Calculator,
    label: 'Explain mathematics step by step.',
    category: 'Mathematics',
  },
  {
    icon: Languages,
    label: 'Translate English into Hindi.',
    category: 'Language',
  },
  {
    icon: Lightbulb,
    label: 'Give me creative business ideas.',
    category: 'Business',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  settings,
  isGenerating,
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  onRetryMessage,
  onNewChat,
  onOpenSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = settings.theme === 'dark';
  const hasMessages = conversation && conversation.messages.length > 0;

  // Auto-scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isGenerating) return;
    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const att = await processUploadedFile(files[i]);
        newAttachments.push(att);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Drag and drop file support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const att = await processUploadedFile(files[i]);
        newAttachments.push(att);
      } catch (err) {
        console.error('Error reading dropped file:', err);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[#0e131f] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-950/80 border-2 border-dashed border-indigo-500 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
          <Paperclip className="w-12 h-12 text-indigo-400 mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Drop your files here</h3>
          <p className="text-sm text-slate-300 mt-1">
            Supports TXT, CSV, PDF, DOCX, and image files for instant AI analysis.
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {!hasMessages ? (
          /* Homepage Welcome State */
          <div className="max-w-3xl mx-auto py-8 md:py-16 text-center flex flex-col items-center space-y-8">
            {/* Logo & Headline */}
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-extrabold text-2xl tracking-wider mx-auto">
                UAI
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  Your AI Assistant for Everything.
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Ask anything. Learn anything. Create anything. Let Udit's AI help you turn your
                  ideas into reality.
                </p>
              </div>
            </div>

            {/* Centered Large Chat Input Box */}
            <div className="w-full max-w-2xl text-left">
              <div
                className={`rounded-2xl border transition-all p-3 shadow-xl ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20'
                    : 'bg-white border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
                }`}
              >
                {/* Uploaded attachment previews in homepage input */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200 border border-slate-700"
                      >
                        {att.type === 'image' ? (
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                        <span className="text-[10px] text-slate-400">({formatBytes(att.size)})</span>
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="p-0.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Udit's AI anything..."
                  rows={2}
                  className="w-full bg-transparent resize-none outline-hidden text-sm md:text-base text-slate-100 placeholder-slate-500"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.txt,.csv,.pdf,.docx,.doc,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Attach file (TXT, CSV, PDF, DOCX, Images)"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach file</span>
                    </button>

                    {inputText && (
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Clear input"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onNewChat}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      New chat
                    </button>

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim() && attachments.length === 0}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                        inputText.trim() || attachments.length > 0
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Send message</span>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Prompts Grid */}
            <div className="w-full max-w-2xl space-y-2.5 text-left">
              <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
                <span>Try an example prompt:</span>
                <span className="text-[11px] text-slate-400">Click to run immediately</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXAMPLE_PROMPTS.map((prompt, idx) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(prompt.label, [])}
                      className={`group flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isDark
                          ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-snug line-clamp-2">{prompt.label}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{prompt.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Active Conversation Stream */
          <div className="max-w-3xl mx-auto space-y-6 pb-28">
            {conversation.messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLast = index === conversation.messages.length - 1;
              const isStreamingThis = isLast && isGenerating && message.role === 'assistant';

              return (
                <div
                  key={message.id || index}
                  className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm mt-0.5">
                      UAI
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] md:max-w-[78%] flex flex-col space-y-2 ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* User Attached files */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                              isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-200'
                                : 'bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            {att.type === 'image' && att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-400" />
                            )}
                            <div className="text-left">
                              <p className="font-medium truncate max-w-[150px]">{att.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {formatBytes(att.size)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content Box */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : isDark
                          ? 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="min-w-0">
                          {message.content ? (
                            <MarkdownRenderer content={message.content} />
                          ) : isStreamingThis ? (
                            <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                              <span>Thinking...</span>
                            </div>
                          ) : null}

                          {/* Streaming Blinking Cursor */}
                          {isStreamingThis && message.content && (
                            <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Error Banner if message failed */}
                    {message.error && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs w-full">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-rose-300">Request Error</p>
                          <p className="mt-0.5 text-rose-200/90">{message.error}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => onRetryMessage(index)}
                              className="px-2.5 py-1 rounded bg-rose-700 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
                            >
                              Retry response
                            </button>
                            {message.error.includes('API Key') && (
                              <button
                                onClick={onOpenSettings}
                                className="underline text-rose-300 hover:text-white"
                              >
                                Configure API Key
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons under AI response */}
                    {!isUser && message.content && !isStreamingThis && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pl-1 pt-0.5">
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          title="Copy response"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>

                        <button
                          onClick={() => onRegenerateResponse(index)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          title="Regenerate this answer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Regenerate</span>
                        </button>

                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Input Bar when in active chat */}
      {hasMessages && (
        <div
          className={`sticky bottom-0 z-20 px-4 pb-4 pt-2 border-t backdrop-blur-md ${
            isDark
              ? 'bg-[#0e131f]/95 border-slate-800'
              : 'bg-slate-50/95 border-slate-200'
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Attachment preview chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {att.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                    <span className="text-[10px] text-slate-400">({formatBytes(att.size)})</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container */}
            <div
              className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all shadow-md ${
                isDark
                  ? 'bg-slate-900 border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20'
                  : 'bg-white border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.csv,.pdf,.docx,.doc,.json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Udit's AI anything..."
                rows={1}
                className="flex-1 bg-transparent resize-none outline-hidden text-sm max-h-48 py-1.5 text-slate-100 placeholder-slate-500"
              />

              {/* Stop Generation or Send button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-sm shrink-0"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && attachments.length === 0}
                  className={`p-2 rounded-xl transition-all shadow-sm shrink-0 ${
                    inputText.trim() || attachments.length > 0
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Small Footer Notice */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span>Udit's AI — Your AI Assistant.</span>
              <span className="hidden sm:inline">Use Shift + Enter for new lines</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
