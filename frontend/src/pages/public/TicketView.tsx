import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicTicket } from '../../lib/api';
import { qrDataUrl, ticketUrl } from '../../lib/qr';
import { formatDate, formatDateTime } from '../../lib/format';
import { printTicket, downloadTicketPdf, type PrintTicketData } from '../../lib/print';
import { EventInfo } from '../../components/EventInfo';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Spinner';
import type { PublicTicket } from '../../types';

export function TicketView() {
  const { token = '' } = useParams();
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [qr, setQr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicTicket(token)
      .then(async (t) => {
        if (!active) return;
        if (!t) {
          setNotFound(true);
          return;
        }
        setTicket(t);
        setQr(await qrDataUrl(ticketUrl(token)));
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="container">
        <Spinner label="Carico il tuo biglietto…" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="container">
        <div className="card center">
          <div style={{ fontSize: 52 }}>🤷</div>
          <h2>Biglietto non trovato</h2>
          <p className="muted">
            Il link non è valido. Controlla di aver aperto il link completo che ti
            è stato inviato.
          </p>
        </div>
      </div>
    );
  }

  const valid = ticket.status === 'valid';

  const ticketData = (): PrintTicketData => ({
    holderName: ticket.holder_name,
    qrDataUrl: qr,
    url: ticketUrl(token),
    eventTitle: ticket.event_title,
    eventDate: ticket.event_starts_at ? formatDate(ticket.event_starts_at) : null,
    eventTime: ticket.event_time_label,
    eventLocation: ticket.event_location,
  });

  return (
    <div className="container">
      <div className="card">
        <EventInfo
          title={ticket.event_title}
          description={ticket.event_description}
          startsAt={ticket.event_starts_at}
          timeLabel={ticket.event_time_label}
          location={ticket.event_location}
        />
      </div>

      <div className="card center">
        <p className="subtitle">Biglietto di {ticket.holder_name}</p>

        {valid ? (
          <>
            <div className="qr-box" style={{ marginTop: 8 }}>
              {qr && <img src={qr} alt="QR Code del biglietto" />}
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              Mostra questo QR all'ingresso. <br /> Salva il link tra i preferiti
              per ritrovarlo facilmente.
            </p>
            <div style={{ marginTop: 12 }}>
              <StatusBadge status="valid" />
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'center' }}>
              <button
                className="btn secondary sm"
                onClick={() => printTicket(ticketData())}
                disabled={!qr}
              >
                🖨️ Stampa
              </button>
              <button
                className="btn secondary sm"
                onClick={() => void downloadTicketPdf(ticketData())}
                disabled={!qr}
              >
                ⬇️ Scarica PDF
              </button>
            </div>
          </>
        ) : ticket.status === 'used' ? (
          <div className="result-screen warn" style={{ marginTop: 8 }}>
            <div className="big">✅</div>
            <h2>Biglietto già validato</h2>
            <p>
              Check-in effettuato il{' '}
              <strong>{formatDateTime(ticket.validated_at)}</strong>
            </p>
            {ticket.validator_name && (
              <p className="muted">Operatore: {ticket.validator_name}</p>
            )}
          </div>
        ) : (
          <div className="result-screen err" style={{ marginTop: 8 }}>
            <div className="big">🚫</div>
            <h2>Biglietto revocato</h2>
            <p className="muted">Contatta il Comitato per maggiori dettagli.</p>
          </div>
        )}
      </div>
    </div>
  );
}
