# Dependencias — Hotel Visita al Mar

## Dependencias de Producción

### `react` ^18.3.1

**Descripción:** Biblioteca principal para construir interfaces de usuario.
**Uso en el proyecto:** Toda la UI está construida con componentes React funcionales y hooks.
**Por qué:** Estándar de la industria, excelente rendimiento, ecosystem maduro.

---

### `react-dom` ^18.3.1

**Descripción:** Renderizador de React para el navegador.
**Uso en el proyecto:** `createRoot()` en `main.tsx` para montar la app.
**Por qué:** Requerido por React para el DOM del navegador.

---

### `@supabase/supabase-js` ^2.57.4

**Descripción:** Cliente oficial de Supabase para JavaScript/TypeScript.
**Uso en el proyecto:**
- Consultas a la base de datos PostgreSQL
- Llamadas a funciones RPC (login, crear usuarios)
- Subida de archivos a Storage
**Por qué:** Supabase es el backend del proyecto. Este cliente simplifica todas las operaciones de DB.

**Ejemplo:**
```typescript
const { data, error } = await supabase
  .from('requests')
  .select('*')
  .order('created_at', { ascending: false });
```

---

### `lucide-react` ^0.344.0

**Descripción:** Biblioteca de íconos SVG optimizados para React.
**Uso en el proyecto:** Íconos en toda la interfaz (menú, botones, encabezados, estados vacíos).
**Por qué:** Íconos limpios y consistentes, tree-shakeable (solo se incluyen los usados), sin dependencias adicionales.

**Ejemplo:**
```typescript
import { Search, FileText, Users } from 'lucide-react';
<Search className="h-4 w-4" />
```

---

## Dependencias de Desarrollo

### `vite` ^5.4.2

**Descripción:** Build tool y servidor de desarrollo ultrarrápido.
**Uso en el proyecto:** `npm run dev` para desarrollo, `npm run build` para producción.
**Por qué:** Inicialización instantánea del servidor, HMR (Hot Module Replacement) rápido.

---

### `typescript` ^5.5.3

**Descripción:** Superset tipado de JavaScript.
**Uso en el proyecto:** Todo el código del proyecto está en TypeScript.
**Por qué:** Detecta errores en tiempo de desarrollo, mejora el autocompletado, hace el código más mantenible.

---

### `tailwindcss` ^3.4.1

**Descripción:** Framework CSS utility-first.
**Uso en el proyecto:** Todos los estilos de la interfaz.
**Por qué:** Sin CSS personalizado, estilos consistentes, responsive design sencillo, bundle pequeño.

---

### `@vitejs/plugin-react` ^4.3.1

**Descripción:** Plugin oficial de Vite para React con soporte a Fast Refresh.
**Uso en el proyecto:** Configurado en `vite.config.ts`.
**Por qué:** Necesario para que Vite procese JSX/TSX de React.

---

### `autoprefixer` ^10.4.18 y `postcss` ^8.4.35

**Descripción:** Herramientas para procesar CSS.
**Uso en el proyecto:** Requeridos por Tailwind CSS para funcionar con Vite.
**Por qué:** Tailwind necesita PostCSS para su transformación de clases.

---

### `@types/react` y `@types/react-dom`

**Descripción:** Definiciones de tipos TypeScript para React.
**Uso en el proyecto:** Necesarios para que TypeScript entienda los tipos de React.
**Por qué:** Sin estos, TypeScript no reconocería `JSX`, `ReactNode`, `useState`, etc.

---

## No se Utilizan

Las siguientes herramientas comunes fueron deliberadamente omitidas para mantener el proyecto simple:

- **react-router-dom** — Se usa enrutador simple basado en estado de React
- **axios** — Se usa `supabase-js` que incluye fetch internamente
- **date-fns / moment** — Se usa la API nativa `Date` e `Intl`
- **react-query / tanstack** — Se usan hooks propios con `useEffect`
- **bcryptjs** — El hash se delega a `pgcrypto` en Supabase (más seguro)
- **UI libraries (MUI, Chakra, etc.)** — Se usa Tailwind CSS directamente
