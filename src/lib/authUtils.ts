// Authentication utility functions and domain types.
import type { User } from '@supabase/supabase-js';

export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  status: string;
  email?: string;
}

export function deriveRole(user: User | null, dbRole?: string | null): UserRole {
  if (!user) return 'farmer';
  const email = (user.email || '').toLowerCase().trim();
  const metaRole = (user.user_metadata?.role || '').toLowerCase().trim();
  const rawDbRole = (dbRole || '').toLowerCase().trim();

  // 1. Designated platform admin superuser
  if (email === 'md.abirsharif68@gmail.com') return 'admin';
  if (rawDbRole === 'admin' || metaRole === 'admin') return 'admin';

  // 2. Commercial buyer
  if (rawDbRole === 'buyer' || metaRole === 'buyer') return 'buyer';

  // 3. Agricultural farmer
  return 'farmer';
}
