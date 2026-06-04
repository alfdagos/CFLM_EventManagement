# QR Ticket System — Edizione GitHub Pages + Supabase

Migrazione production-ready del sistema di biglietti con QR code.
Architettura **serverless**: frontend statico su **GitHub Pages**, backend (database +
autenticazione + logica) su **Supabase**.

Primo evento già configurato: **BEVE COMUNQUE VADA** — 1 Agosto 2026, 21:00 → fino a
che reggi, "Chiedi in giro".

---

## Architettura

```
┌──────────────────────────────┐         ┌────────────────────────────────┐
│  GitHub Pages (statico)       │  HTTPS  │  Supabase                       │
│  React + Vite + TypeScript    │ ──────► │  • PostgreSQL (events/tickets)  │
│  • / landing pubblica         │  anon   │  • Auth (operatori)             │
│  • /t/:token biglietto (pub)  │  key    │  • RLS + RPC SECURITY DEFINER   │
│  • /login area staff          │         │    - public_get_ticket()        │
│  • /reception scanner QR      │         │    - validate_ticket()          │
│  • /admin dashboard           │         │    - create_tickets()           │
└──────────────────────────────┘         └────────────────────────────────┘
```

Non esiste un server applicativo: la logica di sicurezza vive nel database
(Row Level Security + funzioni `SECURITY DEFINER`). La `anon key` esposta nel
frontend è pubblica per design — l'accesso ai dati è governato dalle policy RLS.

## Funzionalità

### Parte pubblica (senza login)
- **Landing evento** (`/`): dettagli dell'evento attivo.
- **Biglietto** (`/t/:token`): il partecipante apre il proprio link personale e vede
  il **QR code**, i **dettagli dell'evento** e lo **stato del biglietto**:
  - valido → mostra il QR da esibire all'ingresso;
  - validato → indica **quando** è stato validato e **da quale operatore**;
  - revocato → avviso.

### Area staff (con login Supabase Auth)
- **Reception** (`reception` o `admin`): scanner QR via fotocamera (+ inserimento
  manuale), validazione in un tap con anti-doppia-scansione e feedback visivo.
- **Admin dashboard** (solo `admin`):
  - statistiche check-in in tempo (quasi) reale;
  - creazione biglietti singoli e **in blocco** (una persona per riga);
  - **copia link** / **QR** per ogni biglietto da condividere col partecipante;
  - **revoca/ripristino** biglietti;
  - **export CSV**;
  - modifica dei dettagli dell'evento.

## Struttura del repository

```
CFLM_EventManagement/
├── frontend/                  # SPA React + Vite + TS  → GitHub Pages
│   ├── src/
│   │   ├── pages/public/      # Landing + vista biglietto (pubbliche)
│   │   ├── pages/auth/        # Login
│   │   ├── pages/reception/   # Scanner QR
│   │   ├── pages/admin/       # Dashboard, biglietti, evento
│   │   ├── lib/               # supabase, api, qr, format
│   │   ├── components/        # Spinner, StatusBadge, EventInfo, ProtectedRoute
│   │   └── context/           # AuthContext
│   └── .env.example
├── supabase/
│   ├── migrations/            # 0001 schema · 0002 funzioni · 0003 RLS · 0004 seed · 0005 lista
│   └── config.toml
├── .github/workflows/deploy.yml   # CI/CD → GitHub Pages
└── DEPLOYMENT.md              # Guida passo-passo al go-live
```

## Avvio rapido (sviluppo locale)

```bash
cd frontend
cp .env.example .env.local      # inserisci URL e anon key del tuo progetto Supabase
npm install
npm run dev                     # http://localhost:5173
```

Le migrazioni SQL vanno applicate su Supabase: vedi **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Note di sicurezza
- Nessun segreto nel frontend oltre alla `anon key` (pubblica per design).
- I biglietti **non** sono leggibili in massa dagli utenti anonimi: l'accesso
  pubblico avviene solo per `token` tramite la RPC `public_get_ticket`.
- La validazione (`validate_ticket`) è eseguibile **solo da operatori autenticati**
  e registra operatore + timestamp, con lock per impedire doppi check-in concorrenti.
- Il `token` del biglietto è una stringa casuale non indovinabile (96 bit).

Dettagli completi di deploy in **[DEPLOYMENT.md](DEPLOYMENT.md)**.
