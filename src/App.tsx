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
import { KitchenPage } from './pages/KitchenPage';
import { CleaningPage } from './pages/CleaningPage';
import { RoomsPage } from './pages/RoomsPage';
import { MessagesPage } from './pages/MessagesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ClientLoginPage } from './pages/ClientLoginPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { getClientSession } from './lib/clients';
import type { Client, RouterState } from './types';

function AppContent() {
  const { user, loading } = useAuth();

  const [router, setRouter] = useState<RouterState>(() => {
    const params = new URLSearchParams(window.location.search);
    const validar = params.get('validar');
    if (validar) return { page: 'validate-reservation', reservationCode: validar };
    if (params.has('cliente')) return { page: 'client-login' };
    return { page: 'home' };
  });

  const [clientUser, setClientUser] = useState<Client | null>(() => getClientSession());

  function navigate(state: RouterState) {
    setRouter(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // QR validation — public, no auth
  if (router.page === 'validate-reservation') {
    return <ValidationPage code={router.reservationCode ?? ''} />;
  }

  // Client portal
  if (router.page === 'client-login' || router.page === 'client-dashboard') {
    if (clientUser) {
      return (
        <ClientDashboardPage
          client={clientUser}
          onLogout={() => { setClientUser(null); navigate({ page: 'client-login' }); }}
          onNavigate={navigate}
        />
      );
    }
    return (
      <ClientLoginPage
        onLoginSuccess={(c) => { setClientUser(c); navigate({ page: 'client-dashboard' }); }}
        onNavigate={navigate}
      />
    );
  }

  if (loading) return <FullPageLoader />;

  if (router.page === 'home') {
    return <RequestFormPage onNavigate={navigate} isPublic />;
  }

  if (router.page === 'login' || !user) {
    return <LoginPage onNavigate={navigate} />;
  }

  // Cocinera → specialized full-screen panel (no Layout)
  if (user.role === 'cocinera' && router.page !== 'messages') {
    return <KitchenPage onNavigate={navigate} />;
  }

  // Limpieza → specialized full-screen panel (no Layout)
  if (user.role === 'limpieza' && router.page !== 'messages') {
    return <CleaningPage onNavigate={navigate} />;
  }

  function renderPage() {
    switch (router.page) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;

      case 'rooms':
        return <RoomsPage onNavigate={navigate} />;

      case 'kitchen':
        return <KitchenPage onNavigate={navigate} />;

      case 'cleaning':
        return <CleaningPage onNavigate={navigate} />;

      case 'messages':
        return <MessagesPage onNavigate={navigate} />;

      case 'announcements':
        return <AnnouncementsPage onNavigate={navigate} />;

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
