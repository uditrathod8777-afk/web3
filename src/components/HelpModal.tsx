import React from 'react';
import { X, Sparkles, Code2, BookOpen, Calculator, Languages, FileText, Keyboard, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '../types/chat';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const capabilities = [
    {
      icon: Code2,
      title: 'Programming & Web Engineering',
      desc: 'Python, TypeScript, React, HTML/CSS, C++, Java, SQL, debugging, and software architecture.',
    },
    {
      icon: Calculator,
      title: 'Mathematics & Step-by-Step Logic',
      desc: 'Calculus, algebra, probability, data structures, algorithm analysis, and equations.',
    },
    {
      icon: BookOpen,
      title: 'Education & STEM Explanations',
      desc: 'Physics, chemistry, biology, history, philosophy, and study notes simplified.',
    },
    {
      icon: Languages,
      title: 'Multilingual & Hinglish Translation',
      desc: 'Natural translation across English, Hindi, Hinglish, Spanish, French, German, Japanese, and more.',
    },
    {
      icon: FileText,
      title: 'Document & File Analysis',
      desc: 'Attach TXT, CSV, PDF, DOCX, or images for summarization, data queries, and visual understanding.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              UAI
            </div>
            <div>
              <h2 className="text-base font-bold text-white">About Udit's AI</h2>
              <p className="text-xs text-slate-400">Think Smarter. Create Faster.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
            <h3 className="font-semibold text-white text-sm flex items-center gap-1.5 mb-1">
              <span>Your AI Assistant for Everything</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </h3>
            <p className="text-slate-300 text-xs">
              Udit's AI is built to give you fast, intelligent, and beautifully formatted answers for
              coding, education, writing, math, and creative problem solving.
            </p>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Key Capabilities
            </h4>
            <div className="space-y-2">
              {capabilities.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">{cap.title}</span>
                      <span className="text-slate-400 text-[11px]">{cap.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shortcuts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Send message</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Enter</kbd>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">New line</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Shift+Enter</kbd>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">New chat</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl/⌘+N</kbd>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Close modal</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Udit's AI — Your AI Assistant.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
