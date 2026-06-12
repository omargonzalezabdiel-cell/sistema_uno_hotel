import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMessages, getAllMessages, sendMessage, markMessagesRead } from '../lib/messages';
import { Button, Input, PageHeader, Card, EmptyState } from '../components/UI';
import type { Message, RouterState } from '../types';

interface MessagesPageProps {
  onNavigate: (s: RouterState) => void;
}

export function MessagesPage({ onNavigate }: MessagesPageProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [targetRole, setTargetRole] = useState<string>('recepcion');
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'creador' || user?.role === 'super_admin';

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const data = isAdmin ? await getAllMessages() : await getMessages(user.username);
    setMessages(data);
    if (!isAdmin) await markMessagesRead(user.username);
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setSending(true);
    const toRole = isAdmin ? targetRole : 'recepcion';
    const toName = null;

    await sendMessage(user.role, user.username, toRole, toName, content.trim());
    setContent('');
    setSending(false);
    loadMessages();
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Mensajes" subtitle="Comunicación interna" />

      {isAdmin && (
        <div className="flex gap-2 mb-3">
          {['recepcion', 'limpieza', 'cocina', 'clientes'].map(r => (
            <button
              key={r}
              onClick={() => setTargetRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${targetRole === r ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-4 border-sky-400 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="Sin mensajes" description="Inicie una conversación." />
        ) : (
          messages.map(msg => {
            const isOwn = msg.from_name === user?.username;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isOwn ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200'}`}>
                  {!isOwn && (
                    <p className={`text-xs font-semibold mb-0.5 ${isOwn ? 'text-sky-200' : 'text-slate-500'}`}>
                      {msg.from_name}
                    </p>
                  )}
                  <p className={`text-sm ${isOwn ? 'text-white' : 'text-slate-800'}`}>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-sky-200' : 'text-slate-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          placeholder="Escribir mensaje..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={sending} className="px-4">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
