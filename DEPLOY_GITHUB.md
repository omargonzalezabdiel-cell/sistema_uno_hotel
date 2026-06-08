# Guia de Despliegue en GitHub Pages

Esta guia explica paso a paso como desplegar la aplicacion **Sistema Uno Hotel** en GitHub Pages.

---

## Requisitos Previos

- Una cuenta en GitHub
- Git instalado en tu computadora
- Node.js 18+ instalado

---

## Paso 1: Crear el Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesion.
2. Haz clic en **New** para crear un nuevo repositorio.
3. Asigna el nombre: `sistema_uno_hotel`
4. Selecciona **Public** (GitHub Pages requiere repositorio publico para el plan gratuito).
5. Haz clic en **Create repository**.

---

## Paso 2: Subir el Codigo al Repositorio

En tu computadora, dentro de la carpeta del proyecto, ejecuta:

```bash
git init
git add .
git commit -m "Primer commit - Sistema Uno Hotel"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sistema_uno_hotel.git
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

---

## Paso 3: Configurar Secrets de Entorno (MUY IMPORTANTE)

Tu aplicacion necesita las variables de entorno de Supabase para funcionar. Como el archivo `.env` NO se sube a GitHub (esta en `.gitignore` por seguridad), debes configurarlas como **secrets** en GitHub:

1. En tu repositorio de GitHub, ve a **Settings**.
2. En el menu lateral izquierdo, haz clic en **Secrets and variables > Actions**.
3. Haz clic en **New repository secret**.
4. Agrega estos dos secrets exactamente con estos nombres:

   - **Name:** `VITE_SUPABASE_URL`
   - **Secret:** `https://nqccoildvzhwqtykxacq.supabase.co`

   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Secret:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xY2NvaWxkdnpod3F0eWt4YWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzM3NTEsImV4cCI6MjA5NjUwOTc1MX0.6P5DF-LKtwxOmkdF3Q1ENq1KCid9KJUHK9KHTChnXuk`

5. Haz clic en **Add secret** para cada uno.

> **Sin estos secrets, la aplicacion se desplegara pero mostrara pantalla en blanco o errores de conexion.**

---

## Paso 4: Configurar GitHub Pages

1. En tu repositorio, ve a **Settings > Pages**.
2. En **Source**, selecciona **GitHub Actions**.
3. El workflow ya esta configurado en `.github/workflows/deploy.yml (se subio con el cod).

---

## Paso 5: Desplegar Automaticamente

Cada vez que hagas `git push` a la rama `main`, GitHub Actions automaticamente:
1. Instala las dependencias
2. Compila la aplicacion con las variables de entorno
3. Despliega a GitHub Pages

Tambien puedes ejecutar el workflow manualmente:
1. Ve a **Actions** en tu repositorio.
2. Selecciona el workflow **Deploy to GitHub Pages**.
3. Haz clic en **Run workflow**.

---

## Paso 6: Verificar la URL

Despues de unos minutos, tu aplicacion estara disponible en:

```
https://TU_USUARIO.github.io/sistema_uno_hotel/
```

Puedes encontrar la URL exacta en:
**Settings > Pages** de tu repositorio.

---

## Configuracion ya Aplicada en el Proyecto

El proyecto ya incluye las siguientes configuraciones para GitHub Pages:

### 1. Base path en Vite (`vite.config.ts`)

```ts
export default defineConfig({
  base: '/sistema_uno_hotel/',
  // ...
});
```

Esto asegura que los assets (JS, CSS, imagenes) se carguen desde la ruta correcta.

### 2. Rutas de recursos dinamicas

Las imagenes en `public/` usan el helper `publicUrl()` que respeta el `base` configurado:

```ts
import { publicUrl } from '../lib/assets';

<img src={publicUrl('logo_del_hotel.jpeg')} />
```

### 3. Enrutamiento por estado (sin BrowserRouter)

La aplicacion usa enrutamiento interno por estado de React, compatible con GitHub Pages sin necesidad de HashRouter.

### 4. Error Boundary global

Un `ErrorBoundary` captura errores de React y muestra un mensaje en pantalla en lugar de dejar la pantalla en blanco.

### 5. Manejo seguro de variables de entorno

Las variables de Supabase se leen con `import.meta.env` y el cliente se inicializa sin lanzar excepciones si faltan.

### 6. Script de diagnostico

El `index.html` incluye un script que captura errores globales y los muestra en pantalla para facilitar la depuracion.

---

## Solucion de Problemas

### Pantalla en blanco despues del despliegue

1. Abre las **Herramientas de Desarrollo** del navegador (F12).
2. Ve a la pestana **Console** y busca errores.
3. Verifica que configuraste los **secrets** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub.
4. Verifica que GitHub Pages esta configurado para usar **GitHub Actions** como fuente.
5. Ve a **Actions** en tu repositorio y verifica que el workflow se ejecuto sin errores.

### Error 404 en assets (JS/CSS)

Asegurate de que `base` en `vite.config.ts` coincida exactamente con el nombre del repositorio:

```ts
base: '/NOMBRE_DEL_REPOSITORIO/',
```

### Variables de entorno no funcionan

GitHub Pages es estatico, las variables de entorno se inyectan en **build time** (cuando GitHub Actions compila). Asegurate de:
1. Configurar los secrets en **Settings > Secrets and variables > Actions**.
2. Que el workflow de GitHub Actions las pase al comando de build.

---

## Actualizar el Despliegue

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripcion de los cambios"
git push origin main
```

GitHub Actions desplegara automaticamente la nueva version.

---

## Contacto

Si tienes problemas, revisa la consola del navegador y los mensajes del Error Boundary para diagnosticar el problema. Tambien verifica la pestana **Actions** en GitHub para ver si el workflow fallo.
