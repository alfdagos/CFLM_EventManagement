import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import type { AppRole } from '../types';

interface Props {
  children: ReactNode;
  // ruoli ammessi; se omesso basta essere autenticati
  roles?: AppRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Caricamento…" />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && (!profile || !roles.includes(profile.role))) {
    return (
      <div className="container center">
        <div className="card">
          <h2>Accesso negato</h2>
          <p className="muted">
            Il tuo account non ha i permessi per questa pagina.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
