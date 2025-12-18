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
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchRoleData = async (uid: string, email: string) => {
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', uid)
          .single();

        if (roleError) {
          console.error('Error fetching role:', roleError);
          return { roleId: null, roleName: null };
        }

        let rid = roleData?.role_id ?? null;
        let rname: string | null = null;

        const talukaEmails = [
          'bdopskorpana@gmail.com',
          'bdopsrajura@gmail.com',
          'bdopsjiwati@gmail.com'
        ];

        const isTalukaEmail = talukaEmails.includes(email.trim().toLowerCase());

        if (isTalukaEmail) {
          rid = 7;
          rname = 'taluka';
          console.log('Taluka email detected on session restore');
        } else if (rid !== null) {
          const { data: rolesData } = await supabase
            .from('roles')
            .select('name')
            .eq('id', rid)
            .single();

          rname = rolesData?.name ?? null;
        }

        return { roleId: rid, roleName: rname };
      } catch (error) {
        console.error('Error in fetchRoleData:', error);
        return { roleId: null, roleName: null };
      }
    };

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Session restored, fetching role data...');
          setUserId(session.user.id);
          const { roleId, roleName } = await fetchRoleData(session.user.id, session.user.email || '');
          if (mounted) {
            setRoleId(roleId);
            setRoleName(roleName);
            console.log('Session restored with roleId:', roleId, 'roleName:', roleName);
          }
        }
      } catch (err) {
        console.error('Error retrieving initial session:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserId(null);
          setRoleId(null);
          setRoleName(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Safety timeout: if loading hasn't cleared after 5 seconds, force it off
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Session check timeout after 5s, forcing loading off');
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setUserId(session.user.id);
        const { roleId, roleName } = await fetchRoleData(session.user.id, session.user.email || '');
        if (mounted) {
          setRoleId(roleId);
          setRoleName(roleName);
        }
      } else {
        setUserId(null);
        setRoleId(null);
        setRoleName(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
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
          throw roleError;
        }

        let rid = roleData?.role_id ?? null;
        let rname: string | null = null;

        const talukaEmails = [
          'bdopskorpana@gmail.com',
          'bdopsrajura@gmail.com',
          'bdopsjiwati@gmail.com'
        ];

        const isTalukaEmail = talukaEmails.includes(email.trim().toLowerCase());

        if (isTalukaEmail) {
          rid = 7;
          rname = 'taluka';
          console.log('Taluka email detected, forcing roleId:', rid, 'roleName:', rname);
        }

        console.log('Role ID:', rid);
        setRoleId(rid);

        if (rid !== null && !isTalukaEmail) {
          console.log('Checking PESA permission...');
          const { data: accessData, error: accessError } = await supabase
            .from('application_permissions')
            .select('id')
            .eq('role_id', rid)
            .eq('application_name', 'pesa')
            .maybeSingle();

          if (accessError) {
            console.error('Error checking permission:', accessError);
            throw accessError;
          }

          console.log('PESA access:', accessData ? 'YES' : 'NO');

          if (!accessData) {
            await supabase.auth.signOut();
            throw new Error('You do not have access to PESA application');
          }
        }

        if (!isTalukaEmail && rid !== null) {
          console.log('Fetching role name...');
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name')
            .eq('id', rid)
            .single();

          if (!rolesError) {
            rname = rolesData?.name ?? null;
            console.log('Role name:', rname);
          }
        }

        setRoleName(rname);
        console.log('Login complete - userId:', uid, 'roleId:', rid, 'roleName:', rname);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // If there is no session locally, just clear state and return.
      if (!session) {
        setUserId(null);
        setRoleId(null);
        setRoleName(null);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        // Supabase may throw AuthSessionMissingError when the client has no session stored.
        // Treat that as a successful sign-out (clear local state) rather than a hard error.
        // Error object from supabase-js may have `name` or `message` fields.
        // Handle both shapes defensively.
        const name = (error as any)?.name || (error as any)?.message || '';
        if (String(name).includes('AuthSessionMissing')) {
          console.warn('Auth session missing during signOut; clearing local state.');
        } else {
          throw error;
        }
      }

      setUserId(null);
      setRoleId(null);
      setRoleName(null);
    } catch (err) {
      console.error('Sign out error (handled):', err);
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
