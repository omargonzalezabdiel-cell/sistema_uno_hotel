# API y Servicios — Hotel Visita al Mar

## Módulos del Sistema

### `src/lib/supabase.ts`

Exporta el cliente Supabase singleton.

```typescript
import { supabase } from './lib/supabase';
```

---

### `src/lib/auth.ts`

Gestión de autenticación y sesión.

| Función | Descripción |
|---|---|
| `login(username, password)` | Verifica credenciales vía RPC y guarda sesión |
| `logout()` | Elimina sesión de localStorage |
| `getSession()` | Recupera sesión guardada |
| `canCreateRequest(user)` | Verifica permiso para crear solicitudes |
| `canEditRequest(user)` | Verifica permiso para editar solicitudes |
| `canDeleteRequest(user)` | Verifica permiso para eliminar solicitudes |
| `canManageUsers(user)` | Verifica permiso para gestionar usuarios |
| `getRoleLabel(role)` | Retorna nombre legible del rol |

---

### `src/lib/requests.ts`

Operaciones CRUD sobre solicitudes y viajeros.

| Función | Descripción |
|---|---|
| `getRequests(page, pageSize)` | Lista paginada de solicitudes |
| `getRequestDetail(id)` | Solicitud completa con viajeros |
| `createRequest(data, travelers)` | Crea solicitud + viajeros |
| `updateRequest(id, data, travelers)` | Actualiza solicitud y reemplaza viajeros |
| `deleteRequest(id)` | Elimina solicitud (CASCADE a viajeros) |
| `searchRequests(query)` | Búsqueda por nombre, pasaporte, celular, correo |
| `getDashboardStats()` | Estadísticas del panel principal |
| `calcularNoches(llegada, salidaHotel)` | Calcula noches de hospedaje |
| `calcularTotal(personas, noches)` | Calcula costo estimado |
| `formatDateTime(iso)` | Formatea fecha+hora en español |
| `formatDate(dateStr)` | Formatea fecha en español |
| `generateTxtContent(detail)` | Genera texto para exportación |
| `downloadTxt(detail)` | Descarga archivo .txt |

---

## Funciones RPC en Supabase

Llamadas al servidor con `supabase.rpc()`:

| Función | Parámetros | Retorna |
|---|---|---|
| `verify_login` | `p_username`, `p_password` | Datos del usuario o vacío |
| `create_user` | `p_username`, `p_password`, `p_role` | Datos del usuario creado |
| `update_user_password` | `p_user_id`, `p_new_password` | void |

---

## Tablas de Supabase

Acceso directo con `supabase.from()`:

| Tabla | Operaciones |
|---|---|
| `users` | SELECT (id, username, role, created_at), DELETE |
| `requests` | SELECT, INSERT, UPDATE, DELETE |
| `travelers` | SELECT, INSERT, UPDATE, DELETE |

---

## Supabase Storage

Bucket: `passport-photos`

- Upload de fotos de pasaporte en formato imagen
- URLs públicas para visualización en la UI
- La subida es opcional — si falla, la solicitud se guarda sin foto
