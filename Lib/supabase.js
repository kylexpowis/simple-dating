import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY } from "@env";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // persist session & auto-refresh tokens in AsyncStorage
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: global.fetch,
  },

  realtime: { enabled: true },
});
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  global: {
    fetch: global.fetch,
  },
});
