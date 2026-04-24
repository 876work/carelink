import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  window.ENV.SUPABASE_URL,
  window.ENV.SUPABASE_ANON_KEY,
);
