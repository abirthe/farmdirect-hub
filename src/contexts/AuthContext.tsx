// Authentication context providing session, user identity, database profile, and role state.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

import { deriveRole, type UserRole, type UserProfile } from '@/lib/authUtils';
export type { UserRole, UserProfile };

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFarmer: boolean;
  isBuyer: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, status')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Table error fallback
      }

      const resolvedRole = deriveRole(currentUser, data?.role);
      return {
        id: currentUser.id,
        full_name: data?.full_name || currentUser.user_metadata?.full_name || null,
        role: resolvedRole,
        status: data?.status || 'PENDING',
        email: currentUser.email,
      };
    } catch {
      const resolvedRole = deriveRole(currentUser);
      return {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || null,
        role: resolvedRole,
        status: 'PENDING',
        email: currentUser.email,
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(user);
    setProfile(p);
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initialize active session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser);
        if (isMounted) setProfile(userProfile);
      } else {
        if (isMounted) setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    // 2. Real-time auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser);
        if (isMounted) setProfile(userProfile);
      } else {
        if (isMounted) setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const role = deriveRole(user, profile?.role);
  const isAdmin = role === 'admin';
  const isFarmer = role === 'farmer';
  const isBuyer = role === 'buyer';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        isAdmin,
        isFarmer,
        isBuyer,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
