# Guida al deploy — go-live per l'evento

Tempo stimato: ~30 minuti. Nessuna carta di credito richiesta (piano free Supabase +
GitHub Pages).

---

## 1. Crea il progetto Supabase

1. Vai su <https://supabase.com> → **New project**.
2. Scegli nome, password del database e regione (es. *Frankfurt* per l'Italia).
3. Attendi il provisioning (~2 min).
4. Da **Settings → API** annota:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Applica lo schema del database

Apri **SQL Editor** nella dashboard Supabase ed esegui, **in ordine**, il contenuto di:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_functions.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_seed.sql`  ← crea l'evento "BEVE COMUNQUE VADA"

> In alternativa, con la **Supabase CLI**:
> ```bash
> supabase link --project-ref <ref>
> supabase db push
> ```

## 3. Crea gli operatori

La registrazione self-service è **disattivata**: gli operatori li crei tu.

1. Dashboard → **Authentication → Users → Add user**.
2. Inserisci email + password per ogni operatore (reception e admin).
   Alla creazione, un trigger genera automaticamente il loro profilo con ruolo
   `reception`.
3. **Promuovi l'amministratore** dal SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where email = 'tua-email-admin@esempio.it';
   ```
4. (Opzionale) imposta il nome mostrato nei check-in:
   ```sql
   update public.profiles set full_name = 'Mario (Reception)'
   where email = 'reception@esempio.it';
   ```

> La gestione operatori avviene dalla dashboard Supabase (non dal frontend): un sito
> statico non può custodire in sicurezza la *service role key*, quindi questa è la
> scelta corretta per la produzione.

## 4. Configura le URL di Auth

Dashboard → **Authentication → URL Configuration**:
- **Site URL**: l'URL di GitHub Pages (es. `https://<utente>.github.io/<repo>/`).
- **Redirect URLs**: aggiungi sia l'URL di Pages sia `http://localhost:5173`.

## 5. Deploy del frontend su GitHub Pages

1. Pusha il repository su GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → New repository secret**, aggiungi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builda e
   pubblica ad ogni push su `main` che tocca `frontend/**` (o lanciandolo a mano da
   **Actions → Run workflow**).

> Il routing usa **HashRouter** e Vite è configurato con `base: './'`: l'app funziona
> sia su dominio root sia in sotto-cartella, senza configurazioni extra né errori 404.

## 6. Test di accettazione (checklist pre-evento)

- [ ] `/` mostra i dettagli dell'evento.
- [ ] Login admin → `/admin` accessibile; login reception → `/reception`.
- [ ] In **Admin → Biglietti** creo un biglietto, copio il link e lo apro in incognito:
      vedo QR + stato **Valido** (senza login).
- [ ] In **Reception** scansiono il QR → **Ingresso consentito**.
- [ ] Riscansiono lo stesso QR → **Già validato** con data e operatore.
- [ ] Ricarico la pagina pubblica del biglietto → stato **Validato** con quando/chi.
- [ ] Un biglietto **revocato** dall'admin risulta non valido allo scanner.

## Risoluzione problemi

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| Pagina bianca, errore "Variabili Supabase mancanti" | Secrets non impostati | Aggiungi i secrets e rilancia il workflow |
| Login ok ma "Accesso negato" su `/admin` | Profilo non promosso ad admin | Esegui l'`update` del punto 3 |
| Scanner non parte | Permessi fotocamera negati o non-HTTPS | GitHub Pages è HTTPS; concedi i permessi. Usa l'inserimento manuale come fallback |
| "forbidden" alla validazione | Operatore non autenticato / senza ruolo | Verifica login e ruolo del profilo |
