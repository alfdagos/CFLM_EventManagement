import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { getActiveEvent } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import type { EventRow } from '../../types';

interface AdminContext {
  event: EventRow;
  reloadEvent: () => Promise<void>;
}

// I figli accedono all'evento attivo con useAdminEvent().
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminEvent(): AdminContext {
  return useOutletContext<AdminContext>();
}

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadEvent = useCallback(async () => {
    setEvent(await getActiveEvent());
  }, []);

  useEffect(() => {
    reloadEvent().finally(() => setLoading(false));
  }, [reloadEvent]);

  return (
    <div>
      <div className="topbar">
        <span className="brand">🛠️ Admin</span>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/tickets" className={({ isActive }) => (isActive ? 'active' : '')}>
            Biglietti
          </NavLink>
          <NavLink to="/admin/event" className={({ isActive }) => (isActive ? 'active' : '')}>
            Evento
          </NavLink>
          <NavLink to="/reception" className={({ isActive }) => (isActive ? 'active' : '')}>
            Scanner
          </NavLink>
        </nav>
        <div className="spacer" />
        <span className="muted">{profile?.full_name}</span>
        <button className="btn secondary sm" onClick={() => void signOut()}>
          Esci
        </button>
      </div>

      <div className="container wide">
        {loading ? (
          <Spinner label="Caricamento…" />
        ) : !event ? (
          <div className="card center">
            <h2>Nessun evento attivo</h2>
            <p className="muted">Crea o attiva un evento dalla configurazione del database.</p>
          </div>
        ) : (
          <Outlet context={{ event, reloadEvent } satisfies AdminContext} />
        )}
      </div>
    </div>
  );
}
