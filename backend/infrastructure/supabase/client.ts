import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let isDisabled = false;

export function getSupabaseClient(): SupabaseClient {
  if (isDisabled) {
    throw new Error('Supabase is disabled due to missing configuration');
  }
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.warn('Supabase credentials are missing. Database features will be disabled.');
    isDisabled = true;
    throw new Error('Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  // 验证 URL 格式
  try {
    new URL(url);
  } catch {
    console.error('Invalid SUPABASE_URL format:', url);
    isDisabled = true;
    throw new Error(`Invalid SUPABASE_URL: ${url}. Must be a valid HTTP or HTTPS URL.`);
  }

  try {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    isDisabled = true;
    throw error;
  }
}

export function isSupabaseAvailable(): boolean {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  return !!(url && serviceKey && url.startsWith('http'));
}
