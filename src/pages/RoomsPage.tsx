import { useState, useEffect, useCallback } from 'react';
import { BedDouble, Edit3, X, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRooms, updateRoomStatus, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '../lib/rooms';
import { Button, Input, Select, PageHeader, Card, ErrorMessage } from '../components/UI';
import type { Room, RoomStatus, RouterState } from '../types';

interface RoomsPageProps {
  onNavigate: (s: RouterState) => void;
}

const ALL_STATUSES: RoomStatus[] = ['libre', 'ocupada', 'ocupada_por_horas', 'pendiente_limpieza', 'limpieza_urgente', 'fuera_de_servicio'];

export function RoomsPage({ onNavigate }: RoomsPageProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [error, setError] = useState('');

  // Edit modal
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editStatus, setEditStatus] = useState<RoomStatus>('libre');
  const [editGuest, setEditGuest] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Notification permission
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifGranted(Notification.permission === 'granted');
    }
  }, []);

  const loadRooms = useCallback(async () => {
    const data = await getRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function startEdit(room: Room) {
    setEditingRoom(room);
    setEditStatus(room.status);
    setEditGuest(room.guest_name ?? '');
    setEditNotes(room.notes ?? '');
  }

  async function handleSaveEdit() {
    if (!editingRoom) return;
    setEditLoading(true);
    setError('');

    const needsNotif = editStatus === 'pendiente_limpieza' || editStatus === 'limpieza_urgente';

    const ok = await updateRoomStatus(editingRoom.id, editStatus, editGuest || null, editNotes || null, user?.id ?? null);

    if (!ok) {
      setError('Error al actualizar la habitación.');
      setEditLoading(false);
      return;
    }

    // Send push notification for cleaning alerts
    if (needsNotif && 'Notification' in window && Notification.permission === 'granted') {
      const label = editStatus === 'limpieza_urgente' ? 'URGENTE' : 'Pendiente';
      new Notification('Hotel Vista al Mar - Limpieza', {
        body: `Hab. ${editingRoom.room_number}: ${label} de limpieza`,
        icon: '/logo_del_hotel.jpeg',
      });
    }

    setEditingRoom(null);
    setEditLoading(false);
    loadRooms();
  }

  async function requestNotifPermission() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifGranted(perm === 'granted');
    }
  }

  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);
  const statusCounts: Record<string, number> = {};
  for (const room of rooms) {
    statusCounts[room.status] = (statusCounts[room.status] ?? 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-sky-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Habitaciones"
        subtitle="Gestión de estado y asignación"
        action={
          <button
            onClick={requestNotifPermission}
            className={`p-2 rounded-lg transition-colors ${notifGranted ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
            title={notifGranted ? 'Notificaciones activadas' : 'Activar notificaciones'}
          >
            {notifGranted ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </button>
        }
      />

      <ErrorMessage message={error} />

      {/* Filter strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Todas ({rooms.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filter === s ? ROOM_STATUS_COLORS[s].badge : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {ROOM_STATUS_LABELS[s]} ({statusCounts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredRooms.map(room => {
          const isUrgent = room.status === 'limpieza_urgente';
          return (
            <button
              key={room.id}
              onClick={() => startEdit(room)}
              className={`rounded-xl p-3.5 border text-left transition-all hover:shadow-md active:scale-[0.98] ${ROOM_STATUS_COLORS[room.status].card} ${isUrgent ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Hab. {room.room_number}</p>
                  <span className={`inline-flex text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 ${ROOM_STATUS_COLORS[room.status].badge}`}>
                    {ROOM_STATUS_LABELS[room.status]}
                  </span>
                </div>
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
              </div>
              {room.guest_name && <p className="text-xs text-slate-600 mt-1.5">{room.guest_name}</p>}
              {room.notes && <p className="text-xs text-slate-500 mt-0.5 italic">{room.notes}</p>}
            </button>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Hab. {editingRoom.room_number}</h3>
              <button onClick={() => setEditingRoom(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <Select
              label="Estado"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as RoomStatus)}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{ROOM_STATUS_LABELS[s]}</option>
              ))}
            </Select>

            <Input
              label="Nombre del huésped"
              placeholder="Nombre (opcional)"
              value={editGuest}
              onChange={e => setEditGuest(e.target.value)}
            />

            <Input
              label="Notas"
              placeholder="Notas (opcional)"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
            />

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setEditingRoom(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveEdit} loading={editLoading} className="flex-1">Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
