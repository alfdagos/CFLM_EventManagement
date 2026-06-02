import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import { SetupNeeded } from './components/SetupNeeded';
import { App } from './App';
import './styles/theme.css';

const root = createRoot(document.getElementById('root')!);

if (!isSupabaseConfigured) {
  // Deploy senza secrets: mostra istruzioni invece di una pagina bianca.
  root.render(
    <StrictMode>
      <SetupNeeded />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </StrictMode>
  );
}
