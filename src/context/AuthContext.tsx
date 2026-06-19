import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Profile } from '../types';
import { profiles } from '../data/mockData';

interface AuthContextType {
  user: Profile | null;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);

  const login = (userId: string) => {
    const found = profiles.find((p) => p.id === userId);
    if (found) setUser(found);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
