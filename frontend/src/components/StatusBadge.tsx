import type { TicketStatus } from '../types';

const LABELS: Record<TicketStatus, string> = {
  valid: '✓ Valido',
  used: '✓ Validato',
  revoked: '✕ Revocato',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge ${status}`}>{LABELS[status]}</span>;
}
