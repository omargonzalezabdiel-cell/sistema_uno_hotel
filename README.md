# Hotel Visita al Mar — Sistema de Gestión de Solicitudes de Hospedaje

## Descripción General

Sistema web **Mobile First** para gestionar solicitudes de hospedaje del **Hotel Visita al Mar Hotel & Boutique** (Panamá). Permite al personal del hotel recibir, organizar y exportar solicitudes enviadas por los clientes.

> **Importante:** Este sistema NO realiza reservas automáticas. Su función es recibir y organizar información. Las reservas son confirmadas manualmente por el personal del hotel.

---

## Funcionalidades Principales

| Funcionalidad | Descripción |
|---|---|
| Formulario público | Clientes registran su solicitud sin cuenta |
| Panel administrativo | Personal del hotel visualiza y gestiona solicitudes |
| Cálculo automático | Costo estimado: personas × noches × $20 USD |
| Buscador | Busca por nombre, pasaporte, celular o correo |
| Exportación .txt | Descarga la solicitud como archivo de texto |
| Gestión de usuarios | El Creador administra cuentas y roles |
| Autenticación | Usuario + contraseña (sin correo) |

---

## Arquitectura

```
src/
├── context/
│   └── AuthContext.tsx    # Estado global de sesión (React Context)
├── lib/
│   ├── supabase.ts        # Cliente Supabase singleton
│   ├── auth.ts            # Login, logout, permisos por rol
│   └── requests.ts        # CRUD solicitudes, búsqueda, exportación
├── types/
│   └── index.ts           # Interfaces TypeScript
├── components/
│   ├── Layout.tsx         # Shell con navbar superior e inferior
│   ├── Logo.tsx           # Logo del hotel
│   ├── LoadingSpinner.tsx # Indicador de carga
│   └── UI.tsx             # Componentes reutilizables (Button, Input, Card...)
├── pages/
│   ├── LoginPage.tsx      # Inicio de sesión del personal
│   ├── DashboardPage.tsx  # Panel principal con estadísticas
│   ├── RequestFormPage.tsx  # Formulario crear/editar solicitud
│   ├── RequestsListPage.tsx # Lista paginada de solicitudes
│   ├── RequestDetailPage.tsx # Detalle + exportación .txt
│   ├── SearchPage.tsx     # Búsqueda en tiempo real
│   └── UsersPage.tsx      # Gestión de usuarios (solo Creador)
└── App.tsx                # Enrutador basado en estado
```

---

## Tecnologías

- **React 18** — UI declarativa con hooks
- **Vite** — Build tool ultrarrápido
- **TypeScript** — Tipado estático
- **Tailwind CSS** — Estilos utility-first
- **Supabase** — Base de datos PostgreSQL + autenticación + almacenamiento
- **Lucide React** — Íconos SVG

---

## Usuarios Iniciales

| Usuario | Contraseña | Rol |
|---|---|---|
| Omar Gonzalez | 8189041122 | Creador del Sistema |
| Jose Manuel | 6767 | Super Administrador |

---

## Información del Hotel

**Visita al Mar Hotel & Boutique**
- Calle 6 Avenida Mendez, Diagonal Club Náutica, Panamá
- Tel: 474-6669 / 6315-1015 / 6333-3333
- Email: Aparta Hotel Panama@gmail.com
