import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  mockLogin?: (role: 'farmer' | 'buyer' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Grab initial active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen to real-time login/logout changes dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (session?.access_token === "mock-token") {
      setSession(null);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const mockLogin = (role: 'farmer' | 'buyer' | 'admin') => {
    const mockUser: User = {
      id: `mock-${role}-123`,
      aud: "authenticated",
      role: "authenticated",
      email: `${role}@demo.test`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        full_name: role === 'farmer' ? "Adam (Demo Farmer)" : role === 'buyer' ? "Bengal Agro (Demo Buyer)" : "System Admin",
        role: role
      },
      app_metadata: { provider: "mock" },
      identities: [],
      factors: []
    };
    
    const mockSession: Session = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      expires_at: 9999999999,
      token_type: "bearer",
      user: mockUser
    };
    
    setSession(mockSession);
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, mockLogin }}>
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
