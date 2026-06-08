# Estructura de la Base de Datos — Hotel Visita al Mar

## Extensiones Utilizadas

- **pgcrypto** — Para hash de contraseñas con bcrypt (`crypt()`, `gen_salt()`)

---

## Tabla: `users`

Almacena los usuarios del sistema con autenticación personalizada.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único auto-generado |
| `username` | TEXT (UNIQUE) | Nombre de usuario para login |
| `password_hash` | TEXT | Contraseña cifrada con bcrypt (NO texto plano) |
| `role` | TEXT | Rol del usuario: `creador`, `super_admin`, `usuario_normal` |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación |

---

## Tabla: `requests`

Cada fila representa una solicitud de hospedaje.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `responsable_nombre` | TEXT | Nombre completo del responsable |
| `responsable_pasaporte` | TEXT | Número de pasaporte del responsable |
| `responsable_correo` | TEXT | Correo electrónico (nullable) |
| `responsable_pasaporte_foto` | TEXT | URL de la foto en Supabase Storage (nullable) |
| `cantidad_personas` | INTEGER | Total de personas en el grupo |
| `llegada_panama` | TIMESTAMPTZ | Fecha y hora de llegada a Panamá |
| `salida_panama` | TIMESTAMPTZ | Fecha y hora de salida de Panamá |
| `salida_hotel` | DATE | Fecha de salida del hotel |
| `noches` | INTEGER | Noches calculadas (llegada → salida hotel) |
| `total_estimado` | NUMERIC(10,2) | Costo estimado = personas × noches × $20 |
| `created_by` | UUID (FK) | Referencia a `users.id` (nullable = registro público) |
| `created_at` | TIMESTAMPTZ | Fecha y hora de registro |

---

## Tabla: `travelers`

Cada fila es un integrante del grupo de una solicitud.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `request_id` | UUID (FK) | Referencia a `requests.id` (CASCADE DELETE) |
| `nombre_completo` | TEXT | Nombre del viajero |
| `numero_pasaporte` | TEXT | Número de pasaporte |
| `numero_celular` | TEXT | Número de celular (nullable) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

---

## Relaciones

```
users (1) ──────── (N) requests  (campo: created_by)
requests (1) ──── (N) travelers  (campo: request_id, CASCADE DELETE)
```

---

## Índices

| Índice | Tabla | Columna | Propósito |
|---|---|---|---|
| `idx_requests_created_at` | requests | created_at DESC | Ordenar por fecha |
| `idx_requests_responsable_nombre` | requests | responsable_nombre | Búsqueda por nombre |
| `idx_requests_responsable_pasaporte` | requests | responsable_pasaporte | Búsqueda por pasaporte |
| `idx_requests_responsable_correo` | requests | responsable_correo | Búsqueda por correo |
| `idx_travelers_request_id` | travelers | request_id | JOIN con requests |
| `idx_travelers_nombre` | travelers | nombre_completo | Búsqueda por nombre |
| `idx_travelers_pasaporte` | travelers | numero_pasaporte | Búsqueda por pasaporte |
| `idx_travelers_celular` | travelers | numero_celular | Búsqueda por celular |

---

## Funciones RPC (SECURITY DEFINER)

### `verify_login(p_username, p_password)`

Verifica credenciales usando bcrypt. Retorna datos del usuario si son correctas.

```sql
SELECT * FROM verify_login('Omar Gonzalez', '8189041122');
```

### `create_user(p_username, p_password, p_role)`

Crea un usuario con la contraseña cifrada con bcrypt.

### `update_user_password(p_user_id, p_new_password)`

Actualiza la contraseña de un usuario con nuevo hash bcrypt.

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas permiten acceso anónimo (`anon`) porque el sistema usa autenticación personalizada y no Supabase Auth. El control de acceso se aplica en la capa de aplicación React según el rol del usuario en sesión.

---

## Fórmula de Cálculo

```
Noches = días entre fecha_llegada_panama y fecha_salida_hotel
Total = cantidad_personas × noches × 20 USD
```
