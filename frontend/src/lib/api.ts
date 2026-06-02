import { supabase } from './supabase';
import type {
  EventRow,
  EventStats,
  PublicTicket,
  TicketRow,
  ValidationResponse,
} from '../types';

// ----- Pubblico (no auth) -------------------------------------------------

export async function getActiveEvent(): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPublicTicket(token: string): Promise<PublicTicket | null> {
  const { data, error } = await supabase.rpc('public_get_ticket', { p_token: token });
  if (error) throw error;
  // La RPC ritorna un set di righe: prendiamo la prima.
  const rows = (data ?? []) as PublicTicket[];
  return rows.length ? rows[0] : null;
}

// ----- Reception ----------------------------------------------------------

export async function validateTicket(token: string): Promise<ValidationResponse> {
  const { data, error } = await supabase.rpc('validate_ticket', { p_token: token });
  if (error) throw error;
  return data as ValidationResponse;
}

// ----- Admin --------------------------------------------------------------

export async function listTickets(eventId: string): Promise<TicketRow[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TicketRow[];
}

export async function getStats(eventId: string): Promise<EventStats> {
  const { data, error } = await supabase.rpc('event_stats', { p_event_id: eventId });
  if (error) throw error;
  return data as EventStats;
}

export interface NewPerson {
  holder_name: string;
  holder_email?: string;
  note?: string;
}

export async function createTickets(
  eventId: string,
  people: NewPerson[]
): Promise<TicketRow[]> {
  const { data, error } = await supabase.rpc('create_tickets', {
    p_event_id: eventId,
    p_people: people,
  });
  if (error) throw error;
  return data as TicketRow[];
}

export async function revokeTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function restoreTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'valid', revoked_at: null, validated_at: null, validated_by: null })
    .eq('id', id);
  if (error) throw error;
}

export async function updateEvent(id: string, patch: Partial<EventRow>): Promise<void> {
  const { error } = await supabase.from('events').update(patch).eq('id', id);
  if (error) throw error;
}
