import { createClient } from '@supabase/supabase-js';

// Production Supabase endpoints with fallback for zero-config deployments
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://alvazacydjlyfdwiwzwo.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_sFow3SkEFnoxeglIhmnkyQ_r6uDo2HC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
