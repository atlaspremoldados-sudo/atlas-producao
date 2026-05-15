// supabase/functions/_shared/supabase-admin.ts
//
// Factory do cliente Supabase com service_role para Edge Functions.
// service_role ignora RLS — uso restrito a Edge Functions, NUNCA exposto ao front.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas no ambiente da função.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
