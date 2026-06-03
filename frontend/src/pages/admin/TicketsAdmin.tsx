import { useEffect, useMemo, useState } from 'react';
import {
  listTickets,
  createTickets,
  revokeTicket,
  restoreTicket,
  type NewPerson,
} from '../../lib/api';
import { ticketUrl, qrDataUrl } from '../../lib/qr';
import { formatDate, formatDateTime } from '../../lib/format';
import { printTicket, downloadTicketPdf, type PrintTicketData } from '../../lib/print';
import { useAdminEvent } from './AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Spinner';
import type { EventRow, TicketRow } from '../../types';

export function TicketsAdmin() {
  const { event } = useAdminEvent();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [bulk, setBulk] = useState('');
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState('');
  const [qrTicket, setQrTicket] = useState<TicketRow | null>(null);

  const reload = () => {
    setLoading(true);
    listTickets(event.id)
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(reload, [event.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.holder_name.toLowerCase().includes(q) ||
        (t.holder_email ?? '').toLowerCase().includes(q)
    );
  }, [tickets, query]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    // Una persona per riga. Formato: "Nome Cognome, email (opzionale)"
    const people: NewPerson[] = bulk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, email] = line.split(',').map((s) => s.trim());
        return { holder_name: name, holder_email: email || undefined };
      })
      .filter((p) => p.holder_name);

    if (people.length === 0) return;
    setWorking(true);
    setMsg('');
    try {
      const created = await createTickets(event.id, people);
      setMsg(`✓ Creati ${created.length} biglietti.`);
      setBulk('');
      reload();
    } catch {
      setMsg('Errore nella creazione dei biglietti.');
    } finally {
      setWorking(false);
    }
  }

  async function copyLink(t: TicketRow) {
    await navigator.clipboard.writeText(ticketUrl(t.token));
    setMsg(`✓ Link di ${t.holder_name} copiato negli appunti.`);
  }

  async function toggleRevoke(t: TicketRow) {
    if (t.status === 'revoked') {
      await restoreTicket(t.id);
    } else {
      if (!confirm(`Revocare il biglietto di ${t.holder_name}?`)) return;
      await revokeTicket(t.id);
    }
    reload();
  }

  function exportCsv() {
    const header = 'nome,email,stato,creato,validato,link\n';
    const rows = tickets
      .map((t) =>
        [
          t.holder_name,
          t.holder_email ?? '',
          t.status,
          t.created_at,
          t.validated_at ?? '',
          ticketUrl(t.token),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'biglietti.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Crea biglietti</h2>
        <p className="muted">
          Una persona per riga. Formato: <code>Nome Cognome, email</code> (l'email è
          opzionale). Dopo la creazione potrai copiare il link o mostrare il QR.
        </p>
        <form onSubmit={onCreate}>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={'Mario Rossi, mario@example.com\nLucia Bianchi'}
          />
          <button className="btn" type="submit" disabled={working} style={{ marginTop: 12 }}>
            {working ? 'Creazione…' : 'Crea biglietti'}
          </button>
        </form>
        {msg && <div className="alert ok" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Cerca per nome o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn secondary" onClick={exportCsv}>
            Esporta CSV
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Stato</th>
                  <th>Validato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.holder_name}</strong>
                      {t.holder_email && <div className="muted">{t.holder_email}</div>}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="muted">{t.validated_at ? formatDateTime(t.validated_at) : '—'}</td>
                    <td>
                      <div className="row">
                        <button className="btn secondary sm" onClick={() => void copyLink(t)}>
                          Copia link
                        </button>
                        <button className="btn cyan sm" onClick={() => setQrTicket(t)}>
                          QR
                        </button>
                        <button
                          className={`btn sm ${t.status === 'revoked' ? 'secondary' : 'danger'}`}
                          onClick={() => void toggleRevoke(t)}
                        >
                          {t.status === 'revoked' ? 'Ripristina' : 'Revoca'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="center muted">Nessun biglietto.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrTicket && <QrModal ticket={qrTicket} event={event} onClose={() => setQrTicket(null)} />}
    </div>
  );
}

function QrModal({
  ticket,
  event,
  onClose,
}: {
  ticket: TicketRow;
  event: EventRow;
  onClose: () => void;
}) {
  const [qr, setQr] = useState('');
  const url = ticketUrl(ticket.token);

  useEffect(() => {
    qrDataUrl(url).then(setQr);
  }, [url]);

  const ticketData = (): PrintTicketData => ({
    holderName: ticket.holder_name,
    qrDataUrl: qr,
    url,
    eventTitle: event.title,
    eventDate: event.starts_at ? formatDate(event.starts_at) : null,
    eventTime: event.time_label,
    eventLocation: event.location,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div className="card center" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <h3>{ticket.holder_name}</h3>
        <div className="qr-box">{qr && <img src={qr} alt="QR" />}</div>
        <p className="muted" style={{ wordBreak: 'break-all', fontSize: 12, marginTop: 12 }}>{url}</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn secondary sm" onClick={() => navigator.clipboard.writeText(url)}>
            Copia link
          </button>
          <button className="btn cyan sm" onClick={() => printTicket(ticketData())} disabled={!qr}>
            🖨️ Stampa
          </button>
          <button className="btn cyan sm" onClick={() => void downloadTicketPdf(ticketData())} disabled={!qr}>
            ⬇️ PDF
          </button>
          <button className="btn sm" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
