import { useState } from 'react';
import { updateEvent } from '../../lib/api';
import { useAdminEvent } from './AdminLayout';

// Converte un ISO in valore per <input type="datetime-local"> (ora locale).
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EventSettings() {
  const { event, reloadEvent } = useAdminEvent();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(event.starts_at));
  const [timeLabel, setTimeLabel] = useState(event.time_label ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [capacity, setCapacity] = useState(event.capacity?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        time_label: timeLabel.trim() || null,
        location: location.trim() || null,
        capacity: capacity ? Number(capacity) : null,
      });
      await reloadEvent();
      setMsg('✓ Evento aggiornato.');
    } catch {
      setMsg('Errore nel salvataggio.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2>Impostazioni evento</h2>
      <form onSubmit={onSave} className="stack">
        <div>
          <label htmlFor="t">Titolo</label>
          <input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="d">Descrizione</label>
          <textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="s">Data e ora di inizio</label>
          <input id="s" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label htmlFor="tl">Etichetta orario (testo libero)</label>
          <input id="tl" value={timeLabel} onChange={(e) => setTimeLabel(e.target.value)} placeholder="21:00 → fino a che reggi" />
        </div>
        <div>
          <label htmlFor="loc">Luogo</label>
          <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cap">Capienza (vuoto = illimitata)</label>
          <input id="cap" type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        {msg && <div className="alert ok">{msg}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </form>
    </div>
  );
}
