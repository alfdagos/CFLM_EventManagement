-- =====================================================================
-- 0006_public_list.sql  —  Espone list_name nella vista pubblica
-- =====================================================================
-- Aggiunge list_name all'output di public_get_ticket (usata dalla pagina
-- pubblica del biglietto, senza autenticazione). Cambiando la firma di
-- ritorno serve DROP + CREATE. Idempotente.
-- =====================================================================

drop function if exists public.public_get_ticket(text);

create or replace function public.public_get_ticket(p_token text)
returns table (
    holder_name       text,
    list_name         text,
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
        t.list_name,
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
