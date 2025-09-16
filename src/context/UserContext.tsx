import React, { createContext, useContext, useState } from 'react';
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
  // Mock user for demo - in real app this would come from authentication
  const [user] = useState<User>({
    id: '1',
    name: 'Demo User',
    role: 'bdo', // Change this to test different roles
    district: 'Pune',
    block: 'Haveli'
  });

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <UserContext.Provider value={{ user, setUser: () => {}, hasPermission }}>
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