-- =====================================================================
-- 0002_functions.sql  —  Funzioni, trigger e RPC
-- =====================================================================

-- ---------------------------------------------------------------------
-- gen_ticket_token() — token segreto url-safe (~16 caratteri)
-- ---------------------------------------------------------------------
create or replace function public.gen_ticket_token()
returns text
language sql
volatile
as $$
    select replace(replace(replace(
             encode(extensions.gen_random_bytes(12), 'base64'),
           '+', '-'), '/', '_'), '=', '');
$$;

-- Popola automaticamente il token se non fornito
create or replace function public.set_ticket_token()
returns trigger
language plpgsql
as $$
begin
    if new.token is null or length(new.token) = 0 then
        new.token := public.gen_ticket_token();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_tickets_token on public.tickets;
create trigger trg_tickets_token
    before insert on public.tickets
    for each row execute function public.set_ticket_token();

-- ---------------------------------------------------------------------
-- handle_new_user() — crea un profilo quando nasce un auth.user
-- Il primo operatore va promosso ad 'admin' manualmente (vedi DEPLOYMENT.md).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
        'reception'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helper di ruolo — SECURITY DEFINER per evitare ricorsione nelle policy
-- ---------------------------------------------------------------------
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((select role in ('admin', 'reception') from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- public_get_ticket(token) — vista pubblica del biglietto (NO auth)
-- Espone solo i campi necessari al partecipante. Bypassa RLS ma filtra
-- per token, quindi è accessibile solo a chi possiede il link/QR.
-- ---------------------------------------------------------------------
create or replace function public.public_get_ticket(p_token text)
returns table (
    holder_name       text,
    status            text,
    validated_at      timestamptz,
    validator_name    text,
    event_title       text,
    event_description text,
    event_starts_at   timestamptz,
    event_time_label  text,
    event_location    text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        t.holder_name,
        t.status,
        t.validated_at,
        v.full_name as validator_name,
        e.title,
        e.description,
        e.starts_at,
        e.time_label,
        e.location
    from public.tickets t
    join public.events e on e.id = t.event_id
    left join public.profiles v on v.id = t.validated_by
    where t.token = p_token;
$$;

grant execute on function public.public_get_ticket(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- validate_ticket(token) — check-in del biglietto (solo operatori)
-- Ritorna un json: { result, holder_name, validated_at, validator_name, ... }
-- result ∈ { 'validated', 'already_used', 'revoked', 'not_found', 'forbidden' }
-- ---------------------------------------------------------------------
create or replace function public.validate_ticket(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    v_ticket   public.tickets%rowtype;
    v_event    public.events%rowtype;
    v_name     text;
begin
    -- Solo operatori autenticati (admin o reception)
    if not public.is_operator() then
        return jsonb_build_object('result', 'forbidden');
    end if;

    -- Lock pessimistico per evitare doppia validazione concorrente
    select * into v_ticket
    from public.tickets
    where token = p_token
    for update;

    if not found then
        return jsonb_build_object('result', 'not_found');
    end if;

    select * into v_event from public.events where id = v_ticket.event_id;

    if v_ticket.status = 'revoked' then
        return jsonb_build_object(
            'result', 'revoked',
            'holder_name', v_ticket.holder_name,
            'event_title', v_event.title
        );
    end if;

    if v_ticket.status = 'used' then
        select full_name into v_name from public.profiles where id = v_ticket.validated_by;
        return jsonb_build_object(
            'result', 'already_used',
            'holder_name', v_ticket.holder_name,
            'event_title', v_event.title,
            'validated_at', v_ticket.validated_at,
            'validator_name', v_name
        );
    end if;

    -- status = 'valid' → effettua il check-in
    update public.tickets
       set status       = 'used',
           validated_at = now(),
           validated_by = auth.uid()
     where id = v_ticket.id;

    select full_name into v_name from public.profiles where id = auth.uid();

    return jsonb_build_object(
        'result', 'validated',
        'holder_name', v_ticket.holder_name,
        'event_title', v_event.title,
        'validated_at', now(),
        'validator_name', v_name
    );
end;
$$;

grant execute on function public.validate_ticket(text) to authenticated;

-- ---------------------------------------------------------------------
-- create_tickets(event_id, names jsonb) — creazione in blocco (solo admin)
-- names = [{ "holder_name": "...", "holder_email": "...", "note": "..." }, ...]
-- Ritorna le righe create (con token) per condividere subito i link.
-- ---------------------------------------------------------------------
create or replace function public.create_tickets(p_event_id uuid, p_people jsonb)
returns setof public.tickets
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    v_person jsonb;
begin
    if not public.is_admin() then
        raise exception 'forbidden' using errcode = '42501';
    end if;

    for v_person in select * from jsonb_array_elements(p_people)
    loop
        return query
        insert into public.tickets (event_id, holder_name, holder_email, note, created_by)
        values (
            p_event_id,
            v_person ->> 'holder_name',
            nullif(v_person ->> 'holder_email', ''),
            nullif(v_person ->> 'note', ''),
            auth.uid()
        )
        returning *;
    end loop;
end;
$$;

grant execute on function public.create_tickets(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- event_stats(event_id) — contatori per la dashboard
-- ---------------------------------------------------------------------
create or replace function public.event_stats(p_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'total',   count(*),
        'valid',   count(*) filter (where status = 'valid'),
        'used',    count(*) filter (where status = 'used'),
        'revoked', count(*) filter (where status = 'revoked')
    )
    from public.tickets
    where event_id = p_event_id
      and public.is_operator();   -- ritorna 0 ovunque se non operatore
$$;

grant execute on function public.event_stats(uuid) to authenticated;
