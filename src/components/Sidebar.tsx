import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Conversation, UserSettings } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenHelp,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group conversations by Date (Today, Yesterday, Previous 7 Days, Older)
  const groupedConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.messages.some((m) => m.content.toLowerCase().includes(query))
        )
      : conversations;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    // Sort newest updated first
    const sorted = [...filtered].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    sorted.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < 2 * oneDay) {
        yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: last7Days },
      { label: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [conversations, searchQuery]);

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeletingId(null);
  };

  const toggleTheme = () => {
    onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const isDark = settings.theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 transition-transform duration-200 ease-in-out border-r ${
          isDark
            ? 'bg-[#0b0f17] border-slate-800/80 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand & New Chat */}
        <div className="p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* UAI Emblem Logo */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-sm text-white font-bold text-xs tracking-wider">
                UAI
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>Udit's AI</span>
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </h1>
                <p className="text-[11px] text-slate-400">Think Smarter. Create Faster.</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700/60 rounded text-indigo-200">
              ⌘N
            </kbd>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-md border transition-colors outline-hidden ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {groupedConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>{searchQuery ? 'No matching conversations' : 'No chats yet'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-medium text-slate-400 tracking-wider">
                  {group.label}
                </div>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;
                  const isDeleting = deletingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? isDark
                            ? 'bg-slate-800/90 text-white font-medium border border-slate-700/60'
                            : 'bg-slate-100 text-slate-900 font-medium border border-slate-200'
                          : isDark
                          ? 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(e as any, conv.id);
                              if (e.key === 'Escape') handleCancelRename(e as any);
                            }}
                            autoFocus
                            className="flex-1 px-1.5 py-0.5 text-xs bg-slate-900 border border-indigo-500 rounded text-white outline-hidden"
                          />
                          <button
                            onClick={(e) => handleSaveRename(e, conv.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-slate-400 hover:text-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div
                          className="flex items-center justify-between w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] text-rose-400 truncate">Delete chat?</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleConfirmDelete(e, conv.id)}
                              className="px-1.5 py-0.5 text-[10px] font-medium bg-rose-600 text-white rounded hover:bg-rose-500"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-200 rounded hover:bg-slate-600"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 truncate pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                          </div>

                          {/* Action icons on hover or active */}
                          <div
                            className={`flex items-center gap-1 shrink-0 ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            } transition-opacity`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleStartRename(e, conv)}
                              className="p-1 text-slate-400 hover:text-white rounded"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(conv.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Profile, Theme, Settings, Help */}
        <div className={`p-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {/* User profile strip */}
          <div className="flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg bg-slate-900/40">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px]">
                U
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold leading-none text-slate-200">Udit</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Free Tier</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick buttons: Settings & Help */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenSettings}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              onClick={onOpenHelp}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
