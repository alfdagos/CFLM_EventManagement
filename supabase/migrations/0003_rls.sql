-- =====================================================================
-- 0003_rls.sql  —  Row Level Security
-- =====================================================================
-- Modello di accesso:
--   • anon          → legge solo gli eventi attivi; i biglietti SOLO via RPC public_get_ticket
--   • reception      → legge biglietti/eventi; check-in via RPC validate_ticket
--   • admin          → controllo completo
-- =====================================================================

alter table public.events   enable row level security;
alter table public.profiles enable row level security;
alter table public.tickets  enable row level security;

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
drop policy if exists events_select_active on public.events;
create policy events_select_active on public.events
    for select
    using (is_active or public.is_operator());

drop policy if exists events_admin_write on public.events;
create policy events_admin_write on public.events
    for all
    using (public.is_admin())
    with check (public.is_admin());

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
    for select
    using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
    for update
    using (id = auth.uid())
    with check (id = auth.uid() and role = public.app_role());  -- non puoi auto-promuoverti

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
    for all
    using (public.is_admin())
    with check (public.is_admin());

-- ---------------------------------------------------------------------
-- TICKETS
-- Nota: l'accesso pubblico (anon) avviene SOLO tramite le RPC SECURITY
-- DEFINER (public_get_ticket / validate_ticket), non da policy dirette.
-- ---------------------------------------------------------------------
drop policy if exists tickets_operator_select on public.tickets;
create policy tickets_operator_select on public.tickets
    for select
    using (public.is_operator());

drop policy if exists tickets_admin_write on public.tickets;
create policy tickets_admin_write on public.tickets
    for all
    using (public.is_admin())
    with check (public.is_admin());
