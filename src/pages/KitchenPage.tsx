import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, UtensilsCrossed, LogOut, MessageSquare, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isKitchenOpen, getMenuItems, createMenuItem, updateMenuItem, getFoodOrders, updateOrderStatus, CATEGORY_LABELS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/kitchen';
import { Button, Input, Select, ErrorMessage, Card, EmptyState } from '../components/UI';
import { Logo } from '../components/Logo';
import type { MenuItem, FoodOrder, OrderStatus, MenuCategory, RouterState } from '../types';

interface KitchenPageProps {
  onNavigate: (s: RouterState) => void;
}

export function KitchenPage({ onNavigate }: KitchenPageProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Menu form state
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState<MenuCategory>('plato');
  const [menuFormLoading, setMenuFormLoading] = useState(false);
  const [menuFormError, setMenuFormError] = useState('');

  const loadData = useCallback(async () => {
    const [o, m] = await Promise.all([getFoodOrders(true), getMenuItems()]);
    setOrders(o);
    setMenuItems(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const kitchen = isKitchenOpen();

  async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    const ok = await updateOrderStatus(orderId, newStatus);
    if (ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  async function handleCreateMenuItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) { setMenuFormError('El nombre es obligatorio.'); return; }
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price < 0) { setMenuFormError('Precio inválido.'); return; }

    setMenuFormLoading(true);
    setMenuFormError('');
    const item = await createMenuItem({ name: itemName.trim(), description: itemDesc.trim() || undefined, price, category: itemCategory, created_by: user?.id ?? null });
    setMenuFormLoading(false);

    if (!item) { setMenuFormError('Error al crear el plato.'); return; }
    setItemName(''); setItemDesc(''); setItemPrice(''); setItemCategory('plato');
    setShowMenuForm(false);
    setMenuItems(prev => [...prev, item]);
  }

  async function handleToggleMenuItem(id: string, active: boolean) {
    const ok = await updateMenuItem(id, { active: !active });
    if (ok) setMenuItems(prev => prev.map(m => m.id === id ? { ...m, active: !active } : m));
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-orange-600 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            <div>
              <p className="text-sm font-bold leading-tight">Cocina</p>
              <p className="text-xs opacity-80">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate({ page: 'messages' })}
              className="p-2 rounded-lg hover:bg-orange-500 transition-colors"
              aria-label="Mensajes"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-orange-500 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Kitchen status */}
      <div className={`px-4 py-2 text-center text-sm font-semibold ${kitchen.open ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {kitchen.open ? (
          <span className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" /> Cocina abierta — {kitchen.period}
          </span>
        ) : (
          'La cocina se encuentra cerrada.'
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500'}`}
          >
            Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setTab('menu')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'menu' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500'}`}
          >
            Menú ({menuItems.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-8">
        {error && <ErrorMessage message={error} />}

        {tab === 'orders' && (
          orders.length === 0 ? (
            <EmptyState icon={<UtensilsCrossed className="h-10 w-10" />} title="Sin pedidos pendientes" description="Los pedidos aparecerán aquí." />
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Hab. {order.room_number}</p>
                      <p className="text-xs text-slate-500">{order.client_name}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs text-slate-700">
                        {item.quantity}x {item.name} — ${Number(item.price).toFixed(2)}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatTime(order.created_at)}</span>
                    <div className="flex gap-1.5">
                      {order.status === 'pendiente' && (
                        <Button onClick={() => handleStatusUpdate(order.id, 'preparando')} className="text-xs px-3 py-1.5" variant="primary">
                          Preparando
                        </Button>
                      )}
                      {order.status === 'preparando' && (
                        <Button onClick={() => handleStatusUpdate(order.id, 'listo')} className="text-xs px-3 py-1.5" variant="primary">
                          Listo
                        </Button>
                      )}
                      {order.status === 'listo' && (
                        <Button onClick={() => handleStatusUpdate(order.id, 'entregado')} className="text-xs px-3 py-1.5" variant="primary">
                          Entregado
                        </Button>
                      )}
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">Nota: {order.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )
        )}

        {tab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Platos del Menú</h2>
              <Button onClick={() => setShowMenuForm(!showMenuForm)} className="text-xs px-3 py-1.5">
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            </div>

            {showMenuForm && (
              <Card className="p-4 mb-4 border-orange-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Nuevo Plato</h3>
                <form onSubmit={handleCreateMenuItem} className="space-y-3">
                  <ErrorMessage message={menuFormError} />
                  <Input label="Nombre" required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Nombre del plato" />
                  <Input label="Descripción" value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Descripción (opcional)" />
                  <Input label="Precio ($)" required value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" />
                  <Select label="Categoría" value={itemCategory} onChange={e => setItemCategory(e.target.value as MenuCategory)}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setShowMenuForm(false)} className="flex-1">Cancelar</Button>
                    <Button type="submit" loading={menuFormLoading} className="flex-1">Crear</Button>
                  </div>
                </form>
              </Card>
            )}

            {menuItems.length === 0 ? (
              <EmptyState icon={<UtensilsCrossed className="h-10 w-10" />} title="Sin platos en el menú" description="Agregue platos para que los clientes puedan ordenar." />
            ) : (
              <div className="space-y-2">
                {menuItems.map(item => (
                  <Card key={item.id} className={`p-3 ${!item.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{CATEGORY_LABELS[item.category]}</span>
                          <span className="text-xs font-bold text-emerald-600">${Number(item.price).toFixed(2)}</span>
                        </div>
                        {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                      </div>
                      <button
                        onClick={() => handleToggleMenuItem(item.id, item.active)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors"
                        title={item.active ? 'Desactivar' : 'Activar'}
                      >
                        {item.active ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
