import { createClient } from '@supabase/supabase-js';

// Falls back to safe placeholder values in CI/testing environments where .env is not committed
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://mock-ci-project.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
