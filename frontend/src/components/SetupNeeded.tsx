// Mostrata quando mancano le variabili Supabase (es. deploy senza secrets).
// Evita la pagina bianca e spiega come completare la configurazione.
export function SetupNeeded() {
  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card center">
        <div style={{ fontSize: 52 }}>⚙️</div>
        <h1 className="neon-title" style={{ fontSize: 30 }}>
          Configurazione richiesta
        </h1>
        <p className="muted">
          Il frontend è online, ma manca il collegamento a Supabase.
        </p>
        <ul className="event-meta">
          <li>
            <span className="k">1.</span>
            <span className="v">Crea il progetto su Supabase ed esegui le migrazioni SQL.</span>
          </li>
          <li>
            <span className="k">2.</span>
            <span className="v">
              Imposta i secret <code>VITE_SUPABASE_URL</code> e{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in <em>Settings → Secrets and
              variables → Actions</em>.
            </span>
          </li>
          <li>
            <span className="k">3.</span>
            <span className="v">Rilancia il workflow <em>Deploy frontend to GitHub Pages</em>.</span>
          </li>
        </ul>
        <p className="muted" style={{ marginTop: 12 }}>
          Istruzioni complete nel file <code>DEPLOYMENT.md</code> del repository.
        </p>
      </div>
    </div>
  );
}
