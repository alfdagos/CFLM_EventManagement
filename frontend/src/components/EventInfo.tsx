import { formatDate } from '../lib/format';

interface Props {
  title: string;
  description?: string | null;
  startsAt?: string | null;
  timeLabel?: string | null;
  location?: string | null;
}

// Riquadro riutilizzabile con i dettagli dell'evento.
export function EventInfo({ title, description, startsAt, timeLabel, location }: Props) {
  return (
    <div className="center">
      <h1 className="neon-title">{title}</h1>
      {description && <p className="muted">{description}</p>}
      <ul className="event-meta">
        {startsAt && (
          <li>
            <span className="k">📅 Data</span>
            <span className="v">{formatDate(startsAt)}</span>
          </li>
        )}
        {timeLabel && (
          <li>
            <span className="k">🕘 Orario</span>
            <span className="v">{timeLabel}</span>
          </li>
        )}
        {location && (
          <li>
            <span className="k">📍 Luogo</span>
            <span className="v">{location}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
