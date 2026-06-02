import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../../lib/api';
import { useAdminEvent } from './AdminLayout';
import { Spinner } from '../../components/Spinner';
import { EventInfo } from '../../components/EventInfo';
import type { EventStats } from '../../types';

export function Dashboard() {
  const { event } = useAdminEvent();
  const [stats, setStats] = useState<EventStats | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => getStats(event.id).then((s) => active && setStats(s)).catch(() => {});
    load();
    // aggiorna i contatori ogni 15s per riflettere i check-in in tempo (quasi) reale
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [event.id]);

  return (
    <div className="stack">
      <div className="card">
        <EventInfo
          title={event.title}
          description={event.description}
          startsAt={event.starts_at}
          timeLabel={event.time_label}
          location={event.location}
        />
      </div>

      {!stats ? (
        <Spinner />
      ) : (
        <div className="stats">
          <div className="stat">
            <div className="n">{stats.total}</div>
            <div className="l">Totali</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: 'var(--green)' }}>{stats.used}</div>
            <div className="l">Entrati</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: 'var(--cyan)' }}>{stats.valid}</div>
            <div className="l">Da validare</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: 'var(--muted)' }}>{stats.revoked}</div>
            <div className="l">Revocati</div>
          </div>
        </div>
      )}

      <div className="card center">
        <p className="muted">
          Gestisci e condividi i biglietti dalla sezione dedicata.
        </p>
        <Link className="btn" to="/admin/tickets">
          Vai ai biglietti →
        </Link>
      </div>
    </div>
  );
}
