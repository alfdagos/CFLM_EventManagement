-- =====================================================================
-- 0005_list_name.sql  —  Campo "lista di appartenenza" sui biglietti
-- =====================================================================
-- Aggiunge tickets.list_name (opzionale) e aggiorna create_tickets per
-- valorizzarlo in fase di creazione. La modifica di nome/lista avviene
-- via UPDATE diretto (policy admin già esistente: tickets_admin_write).
-- Idempotente.
-- =====================================================================

alter table public.tickets add column if not exists list_name text;

comment on column public.tickets.list_name is 'Lista/gruppo di appartenenza del biglietto (opzionale), es. "Amici di Mario", "Staff", "VIP".';

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
        insert into public.tickets (event_id, holder_name, holder_email, note, list_name, created_by)
        values (
            p_event_id,
            v_person ->> 'holder_name',
            nullif(v_person ->> 'holder_email', ''),
            nullif(v_person ->> 'note', ''),
            nullif(v_person ->> 'list_name', ''),
            auth.uid()
        )
        returning *;
    end loop;
end;
$$;

grant execute on function public.create_tickets(uuid, jsonb) to authenticated;
