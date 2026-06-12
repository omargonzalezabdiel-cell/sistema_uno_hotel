import { useState, useEffect, useCallback } from 'react';
import { Sparkles, LogOut, MessageSquare, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRooms, updateRoomStatus, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '../lib/rooms';
import { Button, Card, EmptyState } from '../components/UI';
import type { Room, RouterState } from '../types';

interface CleaningPageProps {
  onNavigate: (s: RouterState) => void;
}

export function CleaningPage({ onNavigate }: CleaningPageProps) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    const data = await getRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 20000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  async function handleMarkClean(room: Room) {
    const ok = await updateRoomStatus(room.id, 'libre', null, null, user?.id ?? null);
    if (ok) loadRooms();
  }

  const urgentRooms = rooms.filter(r => r.status === 'limpieza_urgente');
  const pendingRooms = rooms.filter(r => r.status === 'pendiente_limpieza');
  const otherRooms = rooms.filter(r => !['limpieza_urgente', 'pendiente_limpieza'].includes(r.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-amber-600 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <div>
              <p className="text-sm font-bold leading-tight">Limpieza</p>
              <p className="text-xs opacity-80">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate({ page: 'messages' })}
              className="p-2 rounded-lg hover:bg-amber-500 transition-colors"
              aria-label="Mensajes"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-amber-500 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Summary */}
      <div className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-3">
          <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{urgentRooms.length}</p>
            <p className="text-xs text-red-500 font-semibold">Urgentes</p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingRooms.length}</p>
            <p className="text-xs text-orange-500 font-semibold">Pendientes</p>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{rooms.filter(r => r.status === 'libre').length}</p>
            <p className="text-xs text-emerald-500 font-semibold">Libres</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-8">
        {/* Urgent rooms */}
        {urgentRooms.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" /> Limpieza Urgente
            </h2>
            <div className="space-y-2">
              {urgentRooms.map(room => (
                <Card key={room.id} className="p-4 border-red-200 bg-red-50 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-800">Hab. {room.room_number}</p>
                      {room.guest_name && <p className="text-xs text-red-600">{room.guest_name}</p>}
                      {room.notes && <p className="text-xs text-red-500 mt-1">{room.notes}</p>}
                    </div>
                    <Button onClick={() => handleMarkClean(room)} variant="primary" className="text-xs px-3 py-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> Limpia
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending rooms */}
        {pendingRooms.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-orange-700 flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" /> Pendientes de Limpieza
            </h2>
            <div className="space-y-2">
              {pendingRooms.map(room => (
                <Card key={room.id} className="p-4 border-orange-200 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-800">Hab. {room.room_number}</p>
                      {room.guest_name && <p className="text-xs text-orange-600">{room.guest_name}</p>}
                      {room.notes && <p className="text-xs text-orange-500 mt-1">{room.notes}</p>}
                    </div>
                    <Button onClick={() => handleMarkClean(room)} variant="primary" className="text-xs px-3 py-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> Limpia
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All rooms */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" /> Estado General
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {otherRooms.map(room => (
              <div
                key={room.id}
                className={`rounded-xl p-2.5 border ${ROOM_STATUS_COLORS[room.status].card}`}
              >
                <p className="text-xs font-bold text-slate-800">{room.room_number}</p>
                <p className={`text-xs font-semibold mt-0.5 ${ROOM_STATUS_COLORS[room.status].badge.replace('bg-', 'text-').replace(/-\d+/, '-600')}`}>
                  {ROOM_STATUS_LABELS[room.status]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
