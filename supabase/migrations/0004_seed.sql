-- =====================================================================
-- 0004_seed.sql  —  Dati iniziali: primo evento
-- =====================================================================
-- Idempotente: non duplica l'evento se già presente.
-- =====================================================================

insert into public.events (title, description, starts_at, time_label, location, is_active)
select
    'BEVE COMUNQUE VADA',
    'La festa dove, qualunque cosa succeda, si beve. Porta il tuo QR all''ingresso.',
    timestamptz '2026-08-01 21:00:00+02',   -- 1 Agosto 2026, 21:00 (ora legale Italia)
    '21:00 → fino a che reggi',
    'Chiedi in giro',
    true
where not exists (
    select 1 from public.events where title = 'BEVE COMUNQUE VADA'
);
