import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

export interface UserProfile {
  id: string;
  role?: string;
  group?: number;
  onboarded?: boolean;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOnboarded: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)       // Firebase Auth user
  const [profile, setProfile] = useState<UserProfile | null>(null) // Firestore user document
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let unsubProfile: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) unsubProfile()
      unsubProfile = null
      setUser(firebaseUser)

      if (firebaseUser) {
        // Listen to user's Firestore document in real time
        const userRef = doc(db, 'users', firebaseUser.uid)
        unsubProfile = onSnapshot(userRef, (snap) => {
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } as UserProfile : null)
          setLoading(false)
        })
      } else {
        // Logged out — clean up
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const isAdmin = profile?.role === 'admin'
  const isOnboarded = profile?.onboarded === true

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isOnboarded }}>
      {children}
    </AuthContext.Provider>
  )
}
