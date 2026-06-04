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

type SortKey = 'holder_name' | 'status' | 'created_at' | 'validated_at';
type SortDir = 'asc' | 'desc';
const PAGE_SIZES = [10, 25, 50, 100];

export function TicketsAdmin() {
  const { event } = useAdminEvent();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [bulk, setBulk] = useState('');
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState('');
  const [qrTicket, setQrTicket] = useState<TicketRow | null>(null);

  // Ordinamento e paginazione
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const reload = () => {
    setLoading(true);
    listTickets(event.id)
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(reload, [event.id]);

  // Filtro (ricerca su nome/email)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.holder_name.toLowerCase().includes(q) ||
        (t.holder_email ?? '').toLowerCase().includes(q)
    );
  }, [tickets, query]);

  // Ordinamento
  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const val = (t: TicketRow): string | number => {
      switch (sortKey) {
        case 'holder_name':
          return t.holder_name.toLowerCase();
        case 'status':
          return t.status;
        case 'created_at':
          return new Date(t.created_at).getTime();
        case 'validated_at':
          return t.validated_at ? new Date(t.validated_at).getTime() : -Infinity;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginazione
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  // Torna a pagina 1 quando cambia ricerca/ordinamento/dimensione pagina
  useEffect(() => {
    setPage(1);
  }, [query, sortKey, sortDir, pageSize]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'holder_name' || key === 'status' ? 'asc' : 'desc');
    }
  }

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
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <SortTh label="Nome" col="holder_name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Stato" col="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Creato" col="created_at" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Validato" col="validated_at" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.holder_name}</strong>
                        {t.holder_email && <div className="muted">{t.holder_email}</div>}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="muted">{formatDateTime(t.created_at)}</td>
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
                  {total === 0 && (
                    <tr>
                      <td colSpan={5} className="center muted">Nessun biglietto.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <div className="row" style={{ marginTop: 14, gap: 10 }}>
                <span className="muted">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} di {total}
                </span>
                <span className="spacer" />
                <label className="row" style={{ gap: 6, margin: 0 }}>
                  <span className="muted">Per pagina</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={{ width: 'auto' }}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="btn secondary sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Prec
                </button>
                <span className="muted">Pag. {currentPage} / {pageCount}</span>
                <button
                  className="btn secondary sm"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Succ ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {qrTicket && <QrModal ticket={qrTicket} event={event} onClose={() => setQrTicket(null)} />}
    </div>
  );
}

// Intestazione di colonna ordinabile.
function SortTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}{' '}
      <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
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
