import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveEvent } from '../../lib/api';
import { EventInfo } from '../../components/EventInfo';
import { Spinner } from '../../components/Spinner';
import type { EventRow } from '../../types';

export function EventLanding() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getActiveEvent()
      .then(setEvent)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      {loading ? (
        <Spinner label="Caricamento evento…" />
      ) : error || !event ? (
        <div className="card center">
          <h2>Nessun evento attivo</h2>
          <p className="muted">Torna più tardi.</p>
        </div>
      ) : (
        <div className="card">
          <EventInfo
            title={event.title}
            description={event.description}
            startsAt={event.starts_at}
            timeLabel={event.time_label}
            location={event.location}
          />
          <div className="card center" style={{ marginTop: 24 }}>
            <p className="subtitle">🎟️ Hai ricevuto un biglietto?</p>
            <p className="muted">
              Apri il link personale che ti è stato condiviso per vedere il tuo QR
              code e lo stato del biglietto. I biglietti vengono emessi
              dal Comitato.
            </p>
          </div>
        </div>
      )}

      <p className="center muted" style={{ marginTop: 28 }}>
        <Link to="/login">Area staff →</Link>
      </p>
    </div>
  );
}
