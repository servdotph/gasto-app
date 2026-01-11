import 'react-native-url-polyfill/auto'
import { Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

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