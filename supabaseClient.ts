import { createClient } from '@supabase/supabase-js';

// Use environment variables or provided fallbacks to ensure the app works in the preview
const supabaseUrl = 'https://xylfnkcgwnisxdlkjvte.supabase.co';
// Hardcoding the key provided by the user to avoid environment variable overrides
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGZua2Nnd25pc3hkbGtqdnRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4ODQwNywiZXhwIjoyMDg3OTY0NDA3fQ.ZT_9EV5sv9QSJkAW3lER_jRaObefIEYRNoSVxD17TNo';

console.log('Supabase Client: Initializing with URL:', supabaseUrl);
console.log('Supabase Client: Key length:', supabaseAnonKey.length);
console.log('Supabase Client: Key ends with:', '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 10));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
