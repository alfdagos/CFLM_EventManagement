import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const { session, profile, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Una volta noti sessione + ruolo, redirige alla pagina giusta.
  useEffect(() => {
    if (session && profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/reception', { replace: true });
    }
  }, [session, profile, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // il redirect avviene nell'useEffect quando il profilo è caricato
    } catch {
      setError('Credenziali non valide.');
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h1 className="neon-title center" style={{ fontSize: 30 }}>
          Area staff
        </h1>
        <p className="muted center">Accesso per operatori reception e admin.</p>
        <form onSubmit={onSubmit} className="stack" style={{ marginTop: 12 }}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert err">{error}</div>}
          <button className="btn block" type="submit" disabled={submitting || loading}>
            {submitting ? 'Accesso…' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  );
}
