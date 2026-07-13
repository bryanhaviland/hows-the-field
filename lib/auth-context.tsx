'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  /** Logged in, but hasn't picked a display name yet — registration isn't finished. */
  needsProfile: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirm: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  completeProfile: (displayName: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user) loadProfile(data.session.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message, needsEmailConfirm: false }
    return { error: null, needsEmailConfirm: !data.session }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const completeProfile = async (displayName: string) => {
    if (!session?.user) return { error: 'Not logged in' }
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: session.user.id, display_name: displayName.trim() })
      .select()
      .single()
    if (error) return { error: error.message }
    setProfile(data)
    return { error: null }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    needsProfile: !!session?.user && !loading && !profileLoading && profile === null,
    signUp,
    signIn,
    signOut,
    completeProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
