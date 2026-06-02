import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/Spinner';
import { EventLanding } from './pages/public/EventLanding';
import { TicketView } from './pages/public/TicketView';
import { Login } from './pages/auth/Login';

// Le aree staff (scanner + admin) sono caricate on-demand: così il bundle
// servito ai partecipanti resta leggero e non include la libreria di scanning.
const Scanner = lazy(() => import('./pages/reception/Scanner').then((m) => ({ default: m.Scanner })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const TicketsAdmin = lazy(() => import('./pages/admin/TicketsAdmin').then((m) => ({ default: m.TicketsAdmin })));
const EventSettings = lazy(() => import('./pages/admin/EventSettings').then((m) => ({ default: m.EventSettings })));

export function App() {
  return (
    <Suspense fallback={<Spinner label="Caricamento…" />}>
      <Routes>
        {/* Pubblico (nessuna autenticazione) */}
        <Route path="/" element={<EventLanding />} />
        <Route path="/t/:token" element={<TicketView />} />
        <Route path="/login" element={<Login />} />

        {/* Reception: admin o reception */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute roles={['admin', 'reception']}>
              <Scanner />
            </ProtectedRoute>
          }
        />

        {/* Admin: solo admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketsAdmin />} />
          <Route path="event" element={<EventSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
