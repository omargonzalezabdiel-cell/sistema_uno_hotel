/**
 * App.tsx — Raíz de la aplicación
 *
 * Implementa un enrutador simple basado en estado de React.
 * No requiere react-router-dom para mantener las dependencias mínimas.
 *
 * Flujo de navegación:
 * - Si no hay sesión → LoginPage o Home (formulario público)
 * - Si hay sesión → Panel administrativo con Layout
 *
 * Páginas:
 * - home: Formulario público de solicitud de hospedaje
 * - login: Inicio de sesión del personal
 * - dashboard: Panel principal con estadísticas
 * - requests-list: Lista paginada de solicitudes
 * - request-detail: Detalle de una solicitud
 * - request-form: Crear o editar una solicitud
 * - search: Buscador de solicitudes
 * - users: Gestión de usuarios (solo rol 'creador')
 */
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/LoadingSpinner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestFormPage } from './pages/RequestFormPage';
import { RequestsListPage } from './pages/RequestsListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { SearchPage } from './pages/SearchPage';
import { UsersPage } from './pages/UsersPage';
import type { RouterState } from './types';

// ============================================================
// COMPONENTE PRINCIPAL (dentro del AuthProvider)
// ============================================================

function AppContent() {
  const { user, loading } = useAuth();

  // Estado del enrutador interno
  const [router, setRouter] = useState<RouterState>({ page: 'home' });

  /** Función de navegación compartida con todos los componentes */
  function navigate(state: RouterState) {
    setRouter(state);
    // Hacer scroll al inicio al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Mostrar pantalla de carga mientras se restaura la sesión
  if (loading) {
    return <FullPageLoader />;
  }

  // ============================================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================================

  // Página pública de formulario de solicitud
  if (router.page === 'home') {
    return (
      <RequestFormPage
        onNavigate={navigate}
        isPublic
      />
    );
  }

  // Página de login
  if (router.page === 'login' || !user) {
    return <LoginPage onNavigate={navigate} />;
  }

  // ============================================================
  // RUTAS PROTEGIDAS (requieren autenticación)
  // ============================================================

  // Renderizar la página activa dentro del Layout
  function renderPage() {
    switch (router.page) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;

      case 'requests-list':
        return <RequestsListPage onNavigate={navigate} />;

      case 'request-detail':
        return router.requestId ? (
          <RequestDetailPage requestId={router.requestId} onNavigate={navigate} />
        ) : (
          <RequestsListPage onNavigate={navigate} />
        );

      case 'request-form':
        return (
          <RequestFormPage
            onNavigate={navigate}
            requestId={router.requestId}
            isPublic={false}
          />
        );

      case 'search':
        return <SearchPage onNavigate={navigate} />;

      case 'users':
        return <UsersPage onNavigate={navigate} />;

      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  }

  return (
    <Layout onNavigate={navigate} currentPage={router.page}>
      {renderPage()}
    </Layout>
  );
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

/**
 * Componente raíz exportado.
 * Envuelve toda la app en AuthProvider para que el contexto
 * de autenticación esté disponible en todos los componentes hijos.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
