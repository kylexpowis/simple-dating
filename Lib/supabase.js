// src/Lib/supabase.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
// src/Lib/supabase.js


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
  // disable realtime in RN so ws doesn’t accidentally get pulled in
  realtime: { enabled: false },
});
