import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://nbwnvsfswkzhytyoayhm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5id252c2Zzd2t6aHl0eW9heWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjE4MjQsImV4cCI6MjA5NTQ5NzgyNH0.M4vJv3CeEA-SNTqbh4VyeZR1H9hUSGbyQma50ofg-Wg'
)
