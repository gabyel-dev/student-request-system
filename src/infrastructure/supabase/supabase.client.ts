import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/src/infrastructure/env'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return client
}