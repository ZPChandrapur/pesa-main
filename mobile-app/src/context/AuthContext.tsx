import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userId: string | null;
  roleId: number | null;
  roleName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const uid = data.user.id;
        console.log('User authenticated, userId:', uid);
        setUserId(uid);

        console.log('Fetching user role...');
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', uid)
          .single();

        if (roleError) {
          console.error('Error fetching role:', roleError);
        }

        const rid = roleData?.role_id ?? null;
        console.log('Role ID:', rid);
        setRoleId(rid);

        if (rid !== null) {
          console.log('Checking PESA permission...');
          const { data: accessData, error: accessError } = await supabase
            .from('application_permissions')
            .select('id')
            .eq('role_id', rid)
            .eq('application_name', 'pesa')
            .maybeSingle();

          if (accessError) {
            console.error('Error checking permission:', accessError);
          }

          console.log('PESA access:', accessData ? 'YES' : 'NO');

          if (!accessData) {
            await supabase.auth.signOut();
            throw new Error('You do not have access to PESA application');
          }

          console.log('Fetching role name...');
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name')
            .eq('id', rid)
            .single();

          if (rolesError) {
            console.error('Error fetching role name:', rolesError);
          }

          const rname = rolesData?.name ?? null;
          console.log('Role name:', rname);
          setRoleName(rname);
        }

        console.log('Login complete - userId:', uid, 'roleId:', rid, 'roleName:', roleData?.name);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserId(null);
      setRoleId(null);
      setRoleName(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userId, roleId, roleName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
