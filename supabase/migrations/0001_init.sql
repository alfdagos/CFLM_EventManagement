-- =====================================================================
-- 0001_init.sql  —  Schema iniziale del QR Ticket System
-- =====================================================================
-- Tabelle: events, profiles, tickets
-- Le policy RLS sono in 0003_rls.sql, le funzioni in 0002_functions.sql.
-- =====================================================================

-- pgcrypto fornisce gen_random_bytes / gen_random_uuid (schema "extensions" su Supabase)
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- EVENTS — un record per evento (il sistema supporta più eventi)
-- ---------------------------------------------------------------------
create table if not exists public.events (
    id          uuid primary key default gen_random_uuid(),
    title       text        not null,
    description text,
    starts_at   timestamptz,                 -- data/ora ufficiale di inizio
    time_label  text,                          -- testo libero, es. "21:00 → fino a che reggi"
    location    text,
    capacity    integer,                       -- null = illimitato
    is_active   boolean     not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table public.events is 'Eventi per cui vengono emessi i biglietti.';

-- ---------------------------------------------------------------------
-- PROFILES — estende auth.users con ruolo applicativo
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    email      text,
    full_name  text,
    role       text        not null default 'reception'
               check (role in ('admin', 'reception')),
    created_at timestamptz not null default now()
);

comment on table public.profiles is 'Operatori del sistema (admin / reception). 1:1 con auth.users.';

-- ---------------------------------------------------------------------
-- TICKETS — un biglietto per partecipante
-- ---------------------------------------------------------------------
create table if not exists public.tickets (
    id            uuid primary key default gen_random_uuid(),
    event_id      uuid        not null references public.events(id) on delete cascade,
    token         text        not null unique,        -- segreto: usato nell'URL pubblico e nel QR
    holder_name   text        not null,
    holder_email  text,
    note          text,
    status        text        not null default 'valid'
                  check (status in ('valid', 'used', 'revoked')),
    created_at    timestamptz not null default now(),
    created_by    uuid        references auth.users(id) on delete set null,
    validated_at  timestamptz,
    validated_by  uuid        references public.profiles(id) on delete set null,
    revoked_at    timestamptz
);

comment on table public.tickets is 'Biglietti emessi. Il token è il segreto che dà accesso pubblico al biglietto.';
comment on column public.tickets.token is 'Stringa casuale url-safe. Inserita nel QR e nel link condiviso con il partecipante.';

create index if not exists idx_tickets_event   on public.tickets(event_id);
create index if not exists idx_tickets_status  on public.tickets(status);
create index if not exists idx_tickets_token   on public.tickets(token);

-- ---------------------------------------------------------------------
-- updated_at automatico su events
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_events_touch on public.events;
create trigger trg_events_touch
    before update on public.events
    for each row execute function public.touch_updated_at();
