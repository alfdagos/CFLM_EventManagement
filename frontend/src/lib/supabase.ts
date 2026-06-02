import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Messaggio chiaro in fase di sviluppo/deploy se mancano le variabili.
  throw new Error(
    'Variabili Supabase mancanti. Definisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ' +
      '(in .env.local per lo sviluppo, nei secrets di GitHub Actions per il deploy).'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'qrticket-auth',
  },
});
