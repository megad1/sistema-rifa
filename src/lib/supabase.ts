// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Uma ou mais variáveis de ambiente do Supabase não foram definidas. Verifique a configuração no painel da Vercel ou no arquivo .env.local.');
}

// Cliente para uso no lado do cliente (client-side/browser)
// Usa a chave anônima pública
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para uso no lado do servidor (server-side/API routes)
// Usa a chave de serviço para ter privilégios de administrador
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

