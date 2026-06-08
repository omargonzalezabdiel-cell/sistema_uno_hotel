# Roles y Permisos — Hotel Visita al Mar

## Jerarquía de Roles

```
creador
  └── super_admin
        └── usuario_normal
```

---

## 1. Creador del Sistema (`creador`)

**Usuario:** Omar Gonzalez

Tiene acceso completo a todas las funciones del sistema.

| Permiso | Acceso |
|---|---|
| Ver solicitudes | ✅ |
| Crear solicitudes | ✅ |
| Editar solicitudes | ✅ |
| Eliminar solicitudes | ✅ |
| Ver lista de usuarios | ✅ |
| Crear usuarios | ✅ |
| Cambiar contraseñas | ✅ |
| Eliminar usuarios | ✅ |
| Acceder al buscador | ✅ |
| Exportar .txt | ✅ |

---

## 2. Super Administrador (`super_admin`)

**Usuario:** Jose Manuel

Acceso operativo completo, sin gestión de usuarios ni configuración global.

| Permiso | Acceso |
|---|---|
| Ver solicitudes | ✅ |
| Crear solicitudes | ✅ |
| Editar solicitudes | ✅ |
| Eliminar solicitudes | ❌ |
| Ver lista de usuarios | ❌ |
| Crear usuarios | ❌ |
| Cambiar contraseñas | ❌ |
| Eliminar usuarios | ❌ |
| Acceder al buscador | ✅ |
| Exportar .txt | ✅ |

---

## 3. Usuario Normal (`usuario_normal`)

Acceso de consulta y búsqueda únicamente.

| Permiso | Acceso |
|---|---|
| Ver solicitudes | ✅ |
| Crear solicitudes | ❌ |
| Editar solicitudes | ❌ |
| Eliminar solicitudes | ❌ |
| Ver lista de usuarios | ❌ |
| Gestionar usuarios | ❌ |
| Acceder al buscador | ✅ |
| Exportar .txt | ✅ |

---

## Control de Acceso en el Código

Los permisos se validan en el cliente mediante funciones del módulo `src/lib/auth.ts`:

```typescript
canCreateRequest(user)   // creador, super_admin
canEditRequest(user)     // creador, super_admin
canDeleteRequest(user)   // solo creador
canManageUsers(user)     // solo creador
```

Los botones de acción se ocultan automáticamente si el usuario no tiene el permiso necesario.

---

## Registro Público (sin cuenta)

Cualquier persona puede registrar una solicitud de hospedaje sin autenticarse. En ese caso:
- El campo `created_by` queda en `NULL` en la base de datos.
- La solicitud aparece en el panel como "Registrado por: Público (sin cuenta)".
