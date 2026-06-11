import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/LoadingSpinner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestFormPage } from './pages/RequestFormPage';
import { RequestsListPage } from './pages/RequestsListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { ReservationPage } from './pages/ReservationPage';
import { SearchPage } from './pages/SearchPage';
import { UsersPage } from './pages/UsersPage';
import { ValidationPage } from './pages/ValidationPage';
import type { RouterState } from './types';

function AppContent() {
  const { user, loading } = useAuth();

  const [router, setRouter] = useState<RouterState>(() => {
    // Verificar si la URL tiene ?validar=CODE (llegada por QR)
    const params = new URLSearchParams(window.location.search);
    const validar = params.get('validar');
    if (validar) return { page: 'validate-reservation', reservationCode: validar };
    return { page: 'home' };
  });

  function navigate(state: RouterState) {
    setRouter(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Página pública de validación por QR — no requiere sesión
  if (router.page === 'validate-reservation') {
    return <ValidationPage code={router.reservationCode ?? ''} />;
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (router.page === 'home') {
    return <RequestFormPage onNavigate={navigate} isPublic />;
  }

  if (router.page === 'login' || !user) {
    return <LoginPage onNavigate={navigate} />;
  }

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

      case 'reservation-detail':
        return router.requestId ? (
          <ReservationPage requestId={router.requestId} onNavigate={navigate} />
        ) : (
          <RequestsListPage onNavigate={navigate} />
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
