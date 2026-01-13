import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

// Expo only exposes env vars to the client at runtime when prefixed with EXPO_PUBLIC_.
// We still accept SUPABASE_URL / SUPABASE_ANON_KEY (per project docs) as a fallback
// for environments/build setups that inject them.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      'Missing Supabase environment variables.',
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (recommended for Expo),',
      'or SUPABASE_URL and SUPABASE_ANON_KEY if your build injects them.',
    ].join(' ')
  )
}

type StorageLike = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

const isWeb = Platform.OS === 'web'
const isServer = isWeb && typeof window === 'undefined'

const memoryStorage: StorageLike = {
  async getItem() {
    return null
  },
  async setItem() {
    // no-op
  },
  async removeItem() {
    // no-op
  },
}

const getAuthStorage = (): StorageLike | undefined => {
  if (isServer) return memoryStorage
  if (isWeb) return undefined

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default as StorageLike
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: getAuthStorage(),
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  }
)