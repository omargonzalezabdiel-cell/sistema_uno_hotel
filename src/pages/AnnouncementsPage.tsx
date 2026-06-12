import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canSendAnnouncements } from '../lib/auth';
import { getAnnouncements, createAnnouncement, deactivateAnnouncement } from '../lib/announcements';
import { Button, Input, PageHeader, Card, EmptyState, ErrorMessage } from '../components/UI';
import type { Announcement, RouterState } from '../types';

interface AnnouncementsPageProps {
  onNavigate: (s: RouterState) => void;
}

export function AnnouncementsPage({ onNavigate }: AnnouncementsPageProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canCreate = canSendAnnouncements(user);

  const loadData = useCallback(async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setFormError('Complete todos los campos.'); return; }

    setFormLoading(true);
    setFormError('');
    const ann = await createAnnouncement(title.trim(), content.trim(), user?.id ?? null, user?.username ?? null);
    setFormLoading(false);

    if (!ann) { setFormError('Error al crear el anuncio.'); return; }
    setTitle(''); setContent(''); setShowForm(false);
    loadData();
  }

  async function handleDeactivate(id: string) {
    const ok = await deactivateAnnouncement(id);
    if (ok) loadData();
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });

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
        title="Avisos"
        subtitle="Notificaciones para huéspedes"
        action={canCreate ? (
          <Button onClick={() => setShowForm(!showForm)} className="text-xs">
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </Button>
        ) : undefined}
      />

      {showForm && (
        <Card className="p-4 mb-4 border-sky-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Nuevo Aviso</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <ErrorMessage message={formError} />
            <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del aviso" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contenido</label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Contenido del aviso..."
                rows={3}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors resize-none"
              />
            </div>
            <Button type="submit" loading={formLoading} className="w-full">Publicar Aviso</Button>
          </form>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-10 w-10" />} title="Sin avisos" description="Los avisos publicados aparecerán aquí." />
      ) : (
        <div className="space-y-2">
          {announcements.map(ann => (
            <Card key={ann.id} className={`p-4 ${!ann.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{ann.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${ann.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {ann.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(ann.created_at)}</span>
                    {ann.created_by_name && <span className="text-xs text-slate-400">por {ann.created_by_name}</span>}
                  </div>
                </div>
                {canCreate && ann.active && (
                  <Button variant="ghost" onClick={() => handleDeactivate(ann.id)} className="text-xs px-2 py-1 text-red-500">
                    Desactivar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
