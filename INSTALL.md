# Guía de Instalación — Hotel Visita al Mar

## Requisitos Previos

- Node.js 18 o superior
- npm 9 o superior
- Cuenta en [Supabase](https://supabase.com)

---

## Instalación Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de Entorno

El archivo `.env` ya contiene las credenciales del proyecto Supabase. Las variables requeridas son:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Construir para producción

```bash
npm run build
```

Los archivos de salida estarán en `dist/`

### 5. Previsualizar la producción

```bash
npm run preview
```

---

## Configuración de Supabase Storage (Opcional)

Para habilitar la subida de fotos de pasaporte, crear el bucket en Supabase:

1. Ir al dashboard de Supabase → Storage
2. Crear un bucket llamado `passport-photos`
3. Configurarlo como público (para acceso a las URLs de las fotos)

Si el bucket no existe, la subida de fotos se saltará silenciosamente.

---

## Verificación de TypeScript

```bash
npm run typecheck
```

---

## Linting

```bash
npm run lint
```

---

## Notas de Despliegue

- Compatible con Vercel, Netlify, Cloudflare Pages
- Es una SPA estática — configurar rewrite a `index.html` para rutas
- Las variables de entorno deben configurarse en la plataforma de despliegue
