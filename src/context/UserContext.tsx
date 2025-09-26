import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { User, UserRole } from '../types';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Role hierarchy: gramsewak < bdo < ceo
const roleHierarchy: Record<UserRole, number> = {
  gramsewak: 1,
  bdo: 2,
  ceo: 3
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();

  // Create user object from authenticated user
  // In a real app, you might fetch additional user data from your database
  const [user, setUser] = useState<User | null>(() => {
    if (!authUser) return null;

    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: (authUser.user_metadata?.role as UserRole) || 'bdo', // Default role
      district: authUser.user_metadata?.district || 'Pune',
      block: authUser.user_metadata?.block || 'Haveli'
    };
  });

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <UserContext.Provider value={{ user, setUser, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
