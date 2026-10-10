import { createClient } from '@supabase/supabase-js';

// Production Supabase endpoints with fallback for zero-config deployments
// Using a proxy URL in dev to bypass CORS issues on localhost
const productionUrl = 'https://alvazacydjlyfdwiwzwo.supabase.co';
const supabaseUrl = import.meta.env.DEV 
  ? (window.location.origin + '/supabase') 
  : (import.meta.env.VITE_SUPABASE_URL || productionUrl);
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdmF6YWN5ZGpseWZkd2l3endvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODI5NzYsImV4cCI6MjEwNzA1ODk3Nn0.Ft2UG3nKrFmgUP5XYG65AaAR5gqAZXmrorHnUEle428';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
