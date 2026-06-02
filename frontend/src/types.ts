// Tipi condivisi del dominio.

export type TicketStatus = 'valid' | 'used' | 'revoked';
export type AppRole = 'admin' | 'reception';

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  time_label: string | null;
  location: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketRow {
  id: string;
  event_id: string;
  token: string;
  holder_name: string;
  holder_email: string | null;
  note: string | null;
  status: TicketStatus;
  created_at: string;
  created_by: string | null;
  validated_at: string | null;
  validated_by: string | null;
  revoked_at: string | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

// Output della RPC public_get_ticket (vista pubblica, no auth).
export interface PublicTicket {
  holder_name: string;
  status: TicketStatus;
  validated_at: string | null;
  validator_name: string | null;
  event_title: string;
  event_description: string | null;
  event_starts_at: string | null;
  event_time_label: string | null;
  event_location: string | null;
}

// Output della RPC validate_ticket.
export type ValidationResult =
  | 'validated'
  | 'already_used'
  | 'revoked'
  | 'not_found'
  | 'forbidden';

export interface ValidationResponse {
  result: ValidationResult;
  holder_name?: string;
  event_title?: string;
  validated_at?: string;
  validator_name?: string;
}

export interface EventStats {
  total: number;
  valid: number;
  used: number;
  revoked: number;
}
