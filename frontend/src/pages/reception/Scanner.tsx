import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { validateTicket } from '../../lib/api';
import { extractToken } from '../../lib/qr';
import { formatDateTime } from '../../lib/format';
import type { ValidationResponse } from '../../types';

const READER_ID = 'reader';

export function Scanner() {
  const { profile, signOut } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false); // evita scansioni multiple ravvicinate
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [manualToken, setManualToken] = useState('');

  // Avvia la fotocamera al montaggio.
  useEffect(() => {
    const html5 = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = html5;

    html5
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => onDecoded(decoded),
        () => {} // ignora i frame senza QR
      )
      .catch(() => setCameraError('Impossibile accedere alla fotocamera. Concedi i permessi o usa l\'inserimento manuale.'));

    return () => {
      // stop best-effort all'unmount
      html5.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function process(token: string) {
    if (busyRef.current || !token) return;
    busyRef.current = true;
    try {
      await scannerRef.current?.pause(true);
    } catch {
      /* pause non disponibile: ignora */
    }
    try {
      const res = await validateTicket(token);
      setResult(res);
    } catch {
      setResult({ result: 'not_found' });
    }
  }

  function onDecoded(decoded: string) {
    void process(extractToken(decoded));
  }

  function next() {
    setResult(null);
    busyRef.current = false;
    try {
      scannerRef.current?.resume();
    } catch {
      /* ignora */
    }
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    void process(extractToken(manualToken));
    setManualToken('');
  }

  return (
    <div>
      <div className="topbar">
        <span className="brand">🎟️ Reception</span>
        <span className="muted">{profile?.full_name}</span>
        <div className="spacer" />
        <button className="btn secondary sm" onClick={() => void signOut()}>
          Esci
        </button>
      </div>

      <div className="container" style={{ maxWidth: 480 }}>
        {result ? (
          <ResultCard res={result} onNext={next} />
        ) : (
          <>
            <h2 className="center">Inquadra il QR del biglietto</h2>
            <div id={READER_ID} />
            {cameraError && <div className="alert err" style={{ marginTop: 12 }}>{cameraError}</div>}

            <form onSubmit={onManualSubmit} className="card" style={{ marginTop: 18 }}>
              <label htmlFor="manual">Inserimento manuale (token o link)</label>
              <div className="row">
                <input
                  id="manual"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="es. Ab3..."
                  style={{ flex: 1 }}
                />
                <button className="btn cyan" type="submit">
                  Verifica
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({ res, onNext }: { res: ValidationResponse; onNext: () => void }) {
  const map = {
    validated: { cls: 'ok', icon: '✅', title: 'Ingresso consentito' },
    already_used: { cls: 'warn', icon: '⚠️', title: 'Già validato!' },
    revoked: { cls: 'err', icon: '🚫', title: 'Biglietto revocato' },
    not_found: { cls: 'err', icon: '❌', title: 'Biglietto non trovato' },
    forbidden: { cls: 'err', icon: '🔒', title: 'Permessi insufficienti' },
  }[res.result];

  return (
    <div className={`result-screen ${map.cls}`}>
      <div className="big">{map.icon}</div>
      <h2>{map.title}</h2>
      {res.holder_name && <p style={{ fontSize: 20, fontWeight: 700 }}>{res.holder_name}</p>}
      {res.result === 'already_used' && (
        <p className="muted">
          Validato il {formatDateTime(res.validated_at)}
          {res.validator_name ? ` da ${res.validator_name}` : ''}
        </p>
      )}
      <button className="btn block" style={{ marginTop: 18 }} onClick={onNext}>
        Scansiona il prossimo
      </button>
    </div>
  );
}
