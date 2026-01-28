import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null

  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set({ error: error.message, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoading: false })
  },

  clearError: () => set({ error: null }),
}))
