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

## Paso 3: Configurar GitHub Pages

1. En tu repositorio de GitHub, ve a la pestana **Settings**.
2. En el menu lateral izquierdo, haz clic en **Pages**.
3. En **Source**, selecciona **Deploy from a branch**.
4. En **Branch**, selecciona `gh-pages` y carpeta `/ (root)`.
5. Haz clic en **Save**.

> Nota: La rama `gh-pages` se creara automaticamente en el Paso 4.

---

## Paso 4: Instalar Dependencias y Compilar

En tu computadora, dentro de la carpeta del proyecto:

```bash
# Instalar dependencias
npm install

# Compilar para produccion
npm run build
```

Esto generara la carpeta `dist/` con los archivos listos para desplegar.

---

## Paso 5: Desplegar con gh-pages

Instala el paquete `gh-pages` como dependencia de desarrollo:

```bash
npm install --save-dev gh-pages
```

Agrega estos scripts en tu `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit -p tsconfig.app.json",
  "deploy": "gh-pages -d dist"
}
```

Luego ejecuta:

```bash
npm run deploy
```

Esto subira automaticamente el contenido de la carpeta `dist/` a la rama `gh-pages`.

---

## Paso 6: Verificar la URL

Despues de unos minutos, tu aplicacion estara disponible en:

```
https://TU_USUARIO.github.io/sistema_uno_hotel/
```

Puedes encontrar la URL exacta en:
**Settings > Pages** de tu repositorio.

---

## Configuracion ya Aplicada

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

---

## Solucion de Problemas

### Pantalla en blanco despues del despliegue

1. Abre las **Herramientas de Desarrollo** del navegador (F12).
2. Ve a la pestana **Console** y busca errores 404.
3. Verifica que la URL del repositorio coincida con `base` en `vite.config.ts`.
4. Si cambiaste el nombre del repositorio, actualiza `base` en `vite.config.ts`.

### Error 404 en assets (JS/CSS)

Asegurate de que `base` en `vite.config.ts` coincida exactamente con el nombre del repositorio:

```ts
base: '/NOMBRE_DEL_REPOSITORIO/',
```

### Variables de entorno no funcionan

GitHub Pages es estatico, las variables de entorno se inyectan en **build time**. Asegurate de que el archivo `.env` exista antes de compilar. **No subas el archivo `.env` a GitHub** (ya esta en `.gitignore`).

---

## Actualizar el Despliegue

Cada vez que hagas cambios:

```bash
npm run build
npm run deploy
```

O si prefieres usar GitHub Actions para despliegue automatico:

1. Ve a **Settings > Pages**.
2. Cambia el origen a **GitHub Actions**.
3. Selecciona el workflow para **Vite / React**.
4. GitHub desplegara automaticamente cada vez que hagas push a `main`.

---

## Contacto

Si tienes problemas, revisa la consola del navegador y los mensajes del Error Boundary para diagnosticar el problema.
