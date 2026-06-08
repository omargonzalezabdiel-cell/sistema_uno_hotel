/*
# Hotel Vista al Mar - Esquema Principal

## Descripción General
Este esquema crea la estructura completa de la base de datos para el sistema de
gestión de solicitudes de hospedaje del Hotel Vista al Mar.

## Nuevas Tablas

### 1. users
Gestión de usuarios del sistema con autenticación personalizada (usuario + contraseña).
- `id` UUID, clave primaria
- `username` TEXT único - nombre de usuario para iniciar sesión
- `password_hash` TEXT - contraseña cifrada con bcrypt (pgcrypto)
- `role` TEXT - rol del usuario: 'creador', 'super_admin', 'usuario_normal'
- `created_at` TIMESTAMPTZ - fecha de creación

### 2. requests
Registro de solicitudes de hospedaje enviadas.
- `id` UUID, clave primaria
- `responsable_nombre` TEXT - nombre completo del responsable del grupo
- `responsable_pasaporte` TEXT - número de pasaporte del responsable
- `responsable_correo` TEXT - correo electrónico (opcional)
- `responsable_pasaporte_foto` TEXT - URL de foto de pasaporte en Storage (opcional)
- `cantidad_personas` INTEGER - total de personas en el grupo
- `llegada_panama` TIMESTAMPTZ - fecha y hora de llegada a Panamá
- `salida_panama` TIMESTAMPTZ - fecha y hora de salida de Panamá
- `salida_hotel` DATE - fecha de salida del hotel
- `noches` INTEGER - cantidad de noches calculada automáticamente
- `total_estimado` NUMERIC(10,2) - costo estimado (personas × noches × $20)
- `created_by` UUID FK a users.id - usuario que registró (null si es público)
- `created_at` TIMESTAMPTZ - fecha de registro

### 3. travelers
Lista de viajeros de cada solicitud.
- `id` UUID, clave primaria
- `request_id` UUID FK a requests.id - solicitud a la que pertenece
- `nombre_completo` TEXT - nombre del viajero
- `numero_pasaporte` TEXT - número de pasaporte
- `numero_celular` TEXT - celular (opcional)
- `created_at` TIMESTAMPTZ - fecha de creación

## Funciones RPC (SECURITY DEFINER)

- `verify_login(username, password)` - verifica credenciales y retorna usuario
- `create_user(username, password, role)` - crea usuario con contraseña cifrada
- `update_user_password(user_id, new_password)` - actualiza contraseña cifrada

## Seguridad (RLS)

Todas las tablas tienen RLS habilitado. Las políticas permiten acceso anónimo
porque el sistema usa autenticación personalizada (no Supabase Auth). El control
de acceso se realiza a nivel de aplicación React según el rol del usuario.

Las funciones RPC usan SECURITY DEFINER para acceder a datos sensibles de manera
segura sin exponer la lógica de verificación al cliente.

## Usuarios Iniciales

- Omar Gonzalez (rol: creador, contraseña cifrada con bcrypt)
- Jose Manuel (rol: super_admin, contraseña cifrada con bcrypt)

## Índices

Índices en columnas frecuentemente consultadas para búsquedas rápidas:
- requests: created_at, responsable_nombre, responsable_pasaporte, responsable_correo
- travelers: request_id, nombre_completo, numero_pasaporte, numero_celular
*/

-- Habilitar extensión pgcrypto para hash de contraseñas (bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username     TEXT        UNIQUE NOT NULL,
  password_hash TEXT       NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('creador', 'super_admin', 'usuario_normal')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: requests
-- ============================================================
CREATE TABLE IF NOT EXISTS requests (
  id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  responsable_nombre         TEXT         NOT NULL,
  responsable_pasaporte      TEXT         NOT NULL,
  responsable_correo         TEXT,
  responsable_pasaporte_foto TEXT,
  cantidad_personas          INTEGER      NOT NULL CHECK (cantidad_personas > 0),
  llegada_panama             TIMESTAMPTZ  NOT NULL,
  salida_panama              TIMESTAMPTZ  NOT NULL,
  salida_hotel               DATE         NOT NULL,
  noches                     INTEGER      NOT NULL CHECK (noches > 0),
  total_estimado             NUMERIC(10,2) NOT NULL,
  created_by                 UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at                 TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- TABLA: travelers
-- ============================================================
CREATE TABLE IF NOT EXISTS travelers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  nombre_completo  TEXT        NOT NULL,
  numero_pasaporte TEXT        NOT NULL,
  numero_celular   TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_requests_created_at
  ON requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requests_responsable_nombre
  ON requests(responsable_nombre);

CREATE INDEX IF NOT EXISTS idx_requests_responsable_pasaporte
  ON requests(responsable_pasaporte);

CREATE INDEX IF NOT EXISTS idx_requests_responsable_correo
  ON requests(responsable_correo);

CREATE INDEX IF NOT EXISTS idx_travelers_request_id
  ON travelers(request_id);

CREATE INDEX IF NOT EXISTS idx_travelers_nombre
  ON travelers(nombre_completo);

CREATE INDEX IF NOT EXISTS idx_travelers_pasaporte
  ON travelers(numero_pasaporte);

CREATE INDEX IF NOT EXISTS idx_travelers_celular
  ON travelers(numero_celular);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;

-- Políticas para users (acceso anónimo - controlado por app)
DROP POLICY IF EXISTS "public_select_users"  ON users;
DROP POLICY IF EXISTS "public_insert_users"  ON users;
DROP POLICY IF EXISTS "public_update_users"  ON users;
DROP POLICY IF EXISTS "public_delete_users"  ON users;

CREATE POLICY "public_select_users"  ON users FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "public_insert_users"  ON users FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_users"  ON users FOR UPDATE  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_users"  ON users FOR DELETE  TO anon, authenticated USING (true);

-- Políticas para requests (acceso anónimo - incluye clientes públicos)
DROP POLICY IF EXISTS "public_select_requests"  ON requests;
DROP POLICY IF EXISTS "public_insert_requests"  ON requests;
DROP POLICY IF EXISTS "public_update_requests"  ON requests;
DROP POLICY IF EXISTS "public_delete_requests"  ON requests;

CREATE POLICY "public_select_requests"  ON requests FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "public_insert_requests"  ON requests FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_requests"  ON requests FOR UPDATE  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_requests"  ON requests FOR DELETE  TO anon, authenticated USING (true);

-- Políticas para travelers
DROP POLICY IF EXISTS "public_select_travelers"  ON travelers;
DROP POLICY IF EXISTS "public_insert_travelers"  ON travelers;
DROP POLICY IF EXISTS "public_update_travelers"  ON travelers;
DROP POLICY IF EXISTS "public_delete_travelers"  ON travelers;

CREATE POLICY "public_select_travelers"  ON travelers FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "public_insert_travelers"  ON travelers FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_travelers"  ON travelers FOR UPDATE  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_travelers"  ON travelers FOR DELETE  TO anon, authenticated USING (true);

-- ============================================================
-- FUNCIÓN RPC: verify_login
-- Verifica usuario y contraseña usando bcrypt. Retorna los datos
-- del usuario si las credenciales son correctas, o vacío si no.
-- SECURITY DEFINER: se ejecuta con permisos del propietario (postgres)
-- para acceder a password_hash de forma segura.
-- ============================================================
CREATE OR REPLACE FUNCTION verify_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.created_at
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- ============================================================
-- FUNCIÓN RPC: create_user
-- Crea un usuario nuevo con la contraseña cifrada con bcrypt.
-- Solo debe llamarse desde el rol 'creador' (validación en app).
-- ============================================================
CREATE OR REPLACE FUNCTION create_user(p_username TEXT, p_password TEXT, p_role TEXT)
RETURNS TABLE(id UUID, username TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  new_created_at TIMESTAMPTZ;
BEGIN
  INSERT INTO users (username, password_hash, role)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_role)
  RETURNING users.id, users.created_at INTO new_id, new_created_at;

  RETURN QUERY SELECT new_id, p_username, p_role, new_created_at;
END;
$$;

-- ============================================================
-- FUNCIÓN RPC: update_user_password
-- Actualiza la contraseña de un usuario con nuevo hash bcrypt.
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- USUARIOS INICIALES (seed)
-- ============================================================
DO $$
BEGIN
  -- CREADOR DEL SISTEMA
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'Omar Gonzalez') THEN
    INSERT INTO users (username, password_hash, role)
    VALUES ('Omar Gonzalez', crypt('8189041122', gen_salt('bf')), 'creador');
  END IF;

  -- SUPER ADMIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'Jose Manuel') THEN
    INSERT INTO users (username, password_hash, role)
    VALUES ('Jose Manuel', crypt('6767', gen_salt('bf')), 'super_admin');
  END IF;
END;
$$;
