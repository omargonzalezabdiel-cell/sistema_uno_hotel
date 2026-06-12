import { useState, useEffect, useCallback } from 'react';
import { Hotel, LogOut, Megaphone, UtensilsCrossed, MessageSquare, ShoppingCart, Plus, Minus, X, Send, Clock } from 'lucide-react';
import { getAnnouncements } from '../lib/announcements';
import { getMenuItems, isKitchenOpen, createFoodOrder, CATEGORY_LABELS } from '../lib/kitchen';
import { getMessages, sendMessage, markMessagesRead } from '../lib/messages';
import { Button, Card, EmptyState, ErrorMessage } from '../components/UI';
import { Logo } from '../components/Logo';
import type { Client, MenuItem, OrderItem, Message, Announcement, RouterState } from '../types';

interface ClientDashboardPageProps {
  client: Client;
  onLogout: () => void;
  onNavigate: (s: RouterState) => void;
}

export function ClientDashboardPage({ client, onLogout }: ClientDashboardPageProps) {
  const [tab, setTab] = useState<'avisos' | 'menu' | 'mensajes'>('avisos');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<Map<string, OrderItem>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  const loadData = useCallback(async () => {
    const [ann, menu, msgs] = await Promise.all([
      getAnnouncements(true),
      getMenuItems(),
      getMessages(client.full_name),
    ]);
    setAnnouncements(ann);
    setMenuItems(menu.filter(m => m.active));
    setMessages(msgs);
    markMessagesRead(client.full_name);
  }, [client.full_name]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const kitchen = isKitchenOpen();
  const cartCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = Array.from(cart.values()).reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.id, { id: item.id, name: item.name, quantity: 1, price: Number(item.price) });
      }
      return next;
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing && existing.quantity > 1) {
        next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }

  async function handlePlaceOrder() {
    if (cart.size === 0 || !kitchen.open) return;
    setOrderLoading(true);
    setOrderError('');
    setOrderSuccess('');

    const items = Array.from(cart.values());
    const order = await createFoodOrder(
      client.room_number ?? 'N/A',
      client.full_name,
      items
    );

    setOrderLoading(false);
    if (!order) {
      setOrderError('Error al realizar el pedido. Intente de nuevo.');
      return;
    }

    setOrderSuccess('Pedido realizado exitosamente.');
    setCart(new Map());
    setShowCart(false);
    setTimeout(() => setOrderSuccess(''), 3000);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgContent.trim()) return;
    setSending(true);
    await sendMessage('cliente', client.full_name, 'recepcion', null, msgContent.trim());
    setMsgContent('');
    setSending(false);
    loadData();
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-sky-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <div>
              <p className="text-sm font-bold leading-tight">{client.full_name}</p>
              {client.room_number && <p className="text-xs opacity-80">Hab. {client.room_number}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-lg hover:bg-sky-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center min-w-[18px]">
                  {cartCount}
                </span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-sky-600 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto flex">
          {[
            { key: 'avisos' as const, label: 'Avisos', Icon: Megaphone },
            { key: 'menu' as const, label: 'Menú', Icon: UtensilsCrossed },
            { key: 'mensajes' as const, label: 'Mensajes', Icon: MessageSquare },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${tab === key ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-8">
        {/* Avisos */}
        {tab === 'avisos' && (
          announcements.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-10 w-10" />} title="Sin avisos" description="No hay avisos activos en este momento." />
          ) : (
            <div className="space-y-2">
              {announcements.map(ann => (
                <Card key={ann.id} className="p-4">
                  <p className="text-sm font-bold text-slate-800">{ann.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(ann.created_at)}</p>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Menu */}
        {tab === 'menu' && (
          <div>
            <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${kitchen.open ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <Clock className="h-4 w-4" />
              {kitchen.open ? `Cocina abierta — ${kitchen.period}` : 'La cocina se encuentra cerrada.'}
            </div>

            <ErrorMessage message={orderError} />
            {orderSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-3">
                {orderSuccess}
              </div>
            )}

            {!kitchen.open && (
              <p className="text-xs text-slate-500 mb-4">Los pedidos solo se pueden realizar durante el horario de cocina.</p>
            )}

            {menuItems.length === 0 ? (
              <EmptyState icon={<UtensilsCrossed className="h-10 w-10" />} title="Menú no disponible" description="El menú estará disponible próximamente." />
            ) : (
              <div className="space-y-1.5">
                {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                  const catItems = menuItems.filter(m => m.category === catKey);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={catKey} className="mb-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{catLabel}</h3>
                      {catItems.map(item => {
                        const inCart = cart.get(item.id);
                        return (
                          <Card key={item.id} className="p-3 mb-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                                <p className="text-xs font-bold text-emerald-600 mt-0.5">${Number(item.price).toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {inCart && (
                                  <>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-bold text-slate-800 min-w-[20px] text-center">{inCart.quantity}</span>
                                  </>
                                )}
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={!kitchen.open}
                                  className="p-1 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-40"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {cartCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-20">
                <Button
                  onClick={() => setShowCart(true)}
                  className="w-full py-3.5 text-base font-bold shadow-2xl"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Ver Carrito ({cartCount}) — ${cartTotal.toFixed(2)}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {tab === 'mensajes' && (
          <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {messages.length === 0 ? (
                <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="Sin mensajes" description="Comuníquese con recepción." />
              ) : (
                messages.map(msg => {
                  const isOwn = msg.from_name === client.full_name;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isOwn ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200'}`}>
                        {!isOwn && <p className="text-xs font-semibold text-slate-500 mb-0.5">{msg.from_name}</p>}
                        <p className={`text-sm ${isOwn ? 'text-white' : 'text-slate-800'}`}>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-sky-200' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                placeholder="Escribir mensaje..."
                value={msgContent}
                onChange={e => setMsgContent(e.target.value)}
                className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Button type="submit" loading={sending} className="px-4">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Su Pedido
              </h3>
              <button onClick={() => setShowCart(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.size === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Carrito vacío</p>
            ) : (
              <div className="space-y-2 mb-4">
                {Array.from(cart.values()).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.quantity}x ${item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3">
                  <p className="text-sm font-bold text-slate-800">Total</p>
                  <p className="text-lg font-bold text-emerald-600">${cartTotal.toFixed(2)}</p>
                </div>
              </div>
            )}

            <ErrorMessage message={orderError} />

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowCart(false)} className="flex-1">Cerrar</Button>
              <Button
                onClick={handlePlaceOrder}
                loading={orderLoading}
                disabled={cart.size === 0 || !kitchen.open}
                className="flex-1"
              >
                Confirmar Pedido
              </Button>
            </div>

            {!kitchen.open && (
              <p className="text-xs text-red-500 mt-2 text-center">La cocina está cerrada. No se pueden realizar pedidos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
