import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import { Send, Search, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';
import { getDateLabel } from '../../lib/formatters';
import { MessageBubble } from '../../components/chat/MessageBubble';

interface EmployerMessagesProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
  initialChat?: { id: string; full_name: string; avatar_url?: string };
}

export function EmployerMessages({ onNavigate, onLogout, initialChat }: EmployerMessagesProps) {
  const [selectedChat, setSelectedChat] = useState<any>(initialChat || null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
        fetchConversations(session.access_token);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const poll = setInterval(() => fetchMessages(selectedChat.id), 5000);
      return () => clearInterval(poll);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const convos = json.data || [];
        setConversations(convos);
        // Enrich selectedChat with avatar_url once conversations load
        setSelectedChat((prev: any) => {
          if (!prev) return prev;
          const match = convos.find((c: any) => c.id === prev.id);
          return match ? { ...prev, avatar_url: match.avatar_url } : prev;
        });
      }
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChat || sending) return;
    setSendError(null);
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSendError('Please log in again.'); setSending(false); return; }
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ receiver_id: selectedChat.id, content: messageInput.trim() })
      });
      const json = await res.json();
      if (res.ok) {
        setMessageInput('');
        fetchMessages(selectedChat.id);
        fetchConversations(session.access_token);
      } else {
        setSendError(json.error || 'Failed to send message.');
      }
    } catch (e: any) {
      setSendError('Network error: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    setDeletingId(msgId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { label: string; msgs: any[] }[], msg) => {
    const label = getDateLabel(msg.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.msgs.push(msg);
    } else {
      groups.push({ label, msgs: [msg] });
    }
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-messages" onNavigate={onNavigate} onLogout={onLogout} />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Messages</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Chat with candidates</p>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden h-[calc(100dvh-89px)]">
          {/* Chat List — full width on mobile, fixed 320px on desktop */}
          <div className={`${showChatOnMobile ? 'hidden' : 'flex'} lg:flex w-full lg:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] flex-col`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] dark:placeholder-gray-500" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations yet</div>
              ) : conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { setSelectedChat(chat); setShowChatOnMobile(true); }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#2D2D2D] transition-colors ${selectedChat?.id === chat.id ? 'bg-[#F5C518]/10 dark:bg-[#F5C518]/20 border-l-4 border-[#F5C518]' : ''}`}
                >
                  {chat.avatar_url
                    ? <img src={chat.avatar_url} alt={chat.full_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{chat.full_name ? chat.full_name.substring(0, 2).toUpperCase() : 'U'}</div>
                  }
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-[#1A1A1A] dark:text-white truncate">{chat.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate capitalize">{chat.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area — full screen on mobile when chat selected */}
          <div className={`${showChatOnMobile ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-[#FFFBF0] dark:bg-[#121212]`}>
            {selectedChat ? (
              <>
                {/* Chat Header with back button on mobile */}
                <div className="p-4 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <button onClick={() => setShowChatOnMobile(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {selectedChat.avatar_url
                    ? <img src={selectedChat.avatar_url} alt={selectedChat.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{selectedChat.full_name ? selectedChat.full_name.substring(0, 2).toUpperCase() : 'U'}</div>
                  }
                  <div>
                    <p className="font-semibold text-[#1A1A1A] dark:text-white">{selectedChat.full_name || 'Unknown User'}</p>
                  </div>
                </div>


                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {groupedMessages.map((group) => (
                    <div key={group.label}>
                      {/* Date Separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2 py-1 bg-gray-100 dark:bg-[#2D2D2D] rounded-full">{group.label}</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      </div>
                      {group.msgs.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        const isDeleting = deletingId === msg.id;
                        return (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMe={isMe}
                            isDeleting={isDeleting}
                            onDelete={handleDelete}
                            hoveredId={hoveredId}
                            setHoveredId={setHoveredId}
                            showInterviewCta={false}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Banner */}
                {sendError && (
                  <div className="mx-4 mb-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
                    <span>⚠️ {sendError}</span>
                    <button onClick={() => setSendError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C518] disabled:opacity-60 dark:placeholder-gray-500"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !messageInput.trim()}
                      className="w-12 h-12 flex-shrink-0 bg-[#F5C518] rounded-full flex items-center justify-center hover:bg-[#E5B508] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5 text-[#1A1A1A]" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-4 border border-transparent dark:border-gray-800">
                    <MessageSquare className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Select a chat to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
