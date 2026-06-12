/**
 * Página de Gestión de Usuarios
 *
 * Solo accesible para el rol 'creador' (Omar Gonzalez).
 * Permite:
 * - Ver la lista completa de usuarios del sistema
 * - Crear nuevos usuarios con rol asignado
 * - Actualizar la contraseña de usuarios existentes
 * - Eliminar usuarios (excepto el propio usuario activo)
 *
 * Las contraseñas se cifran en Supabase usando bcrypt (pgcrypto).
 * Las operaciones sensibles usan funciones RPC SECURITY DEFINER.
 */
import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, KeyRound, Users, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { canManageUsers, getRoleLabel, CREATABLE_ROLES } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Select, RoleBadge, ErrorMessage, SuccessMessage, EmptyState } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { User, UserRole, RouterState } from '../types';

interface UsersPageProps {
  onNavigate: (state: RouterState) => void;
}

export function UsersPage({ onNavigate }: UsersPageProps) {
  const { user: currentUser } = useAuth();

  // Redirigir si no tiene permiso
  useEffect(() => {
    if (!canManageUsers(currentUser)) {
      onNavigate({ page: 'dashboard' });
    }
  }, [currentUser, onNavigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado del formulario de creación
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('usuario_normal');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Estado del cambio de contraseña
  const [changingPwdFor, setChangingPwdFor] = useState<string | null>(null);
  const [newPwdValue, setNewPwdValue] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // ============================================================
  // CARGAR USUARIOS
  // ============================================================

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setUsers((data as User[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ============================================================
  // CREAR USUARIO
  // ============================================================

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUsername.trim()) return setFormError('El nombre de usuario es obligatorio.');
    if (newPassword.length < 4) return setFormError('La contraseña debe tener al menos 4 caracteres.');

    setFormLoading(true);
    const { error: err } = await supabase.rpc('create_user', {
      p_username: newUsername.trim(),
      p_password: newPassword,
      p_role: newRole,
    });
    setFormLoading(false);

    if (err) {
      if (err.message.includes('unique')) {
        setFormError('Ese nombre de usuario ya existe.');
      } else {
        setFormError('Error al crear usuario: ' + err.message);
      }
    } else {
      setFormSuccess(`Usuario "${newUsername.trim()}" creado exitosamente.`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('usuario_normal');
      setShowForm(false);
      loadUsers();
    }
  }

  // ============================================================
  // CAMBIAR CONTRASEÑA
  // ============================================================

  async function handleChangePassword(userId: string) {
    setPwdError('');
    setPwdSuccess('');
    if (newPwdValue.length < 4) {
      setPwdError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setPwdLoading(true);
    const { error: err } = await supabase.rpc('update_user_password', {
      p_user_id: userId,
      p_new_password: newPwdValue,
    });
    setPwdLoading(false);

    if (err) {
      setPwdError('Error al actualizar: ' + err.message);
    } else {
      setPwdSuccess('Contraseña actualizada.');
      setNewPwdValue('');
      setTimeout(() => {
        setChangingPwdFor(null);
        setPwdSuccess('');
      }, 2000);
    }
  }

  // ============================================================
  // ELIMINAR USUARIO
  // ============================================================

  async function handleDeleteUser(userId: string, username: string) {
    if (!confirm(`¿Eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) return;

    const { error: err } = await supabase.from('users').delete().eq('id', userId);
    if (err) {
      setError('Error al eliminar: ' + err.message);
    } else {
      loadUsers();
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (!canManageUsers(currentUser)) return null;

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de acceso al sistema"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <UserPlus className="h-4 w-4" />
            Nuevo
          </Button>
        }
      />

      <ErrorMessage message={error} />
      <SuccessMessage message={formSuccess} />

      {/* Formulario de creación */}
      {showForm && (
        <Card className="p-4 mb-4 border-sky-100">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Crear Nuevo Usuario</h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <ErrorMessage message={formError} />
            <Input
              id="new_username"
              label="Nombre de Usuario"
              required
              placeholder="Nombre de usuario"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Select
              id="new_role"
              label="Rol"
              required
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              {CREATABLE_ROLES.map(r => (
                <option key={r} value={r}>{getRoleLabel(r)}</option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" loading={formLoading} className="flex-1">
                Crear Usuario
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-10 w-10" />} title="Sin usuarios" />
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{u.username}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{getRoleLabel(u.role)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <RoleBadge role={u.role as UserRole} />
                  {/* No permitir eliminar el usuario activo */}
                  {u.id !== currentUser?.id && (
                    <>
                      <button
                        onClick={() => {
                          setChangingPwdFor(changingPwdFor === u.id ? null : u.id);
                          setPwdError('');
                          setPwdSuccess('');
                          setNewPwdValue('');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        aria-label="Cambiar contraseña"
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Eliminar usuario"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {u.id === currentUser?.id && (
                    <span className="text-xs text-slate-400 italic">Tú</span>
                  )}
                </div>
              </div>

              {/* Panel de cambio de contraseña inline */}
              {changingPwdFor === u.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Nueva contraseña</p>
                  <ErrorMessage message={pwdError} />
                  <SuccessMessage message={pwdSuccess} />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={newPwdValue}
                      onChange={(e) => setNewPwdValue(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <Button
                      onClick={() => handleChangePassword(u.id)}
                      loading={pwdLoading}
                      className="px-4"
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
