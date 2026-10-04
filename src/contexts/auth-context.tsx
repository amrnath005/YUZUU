"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Workspace } from '@/types';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { store } from '@/data/store';
import { AuthModal } from '@/features/auth/auth-modal';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  workspace: null,
  session: null,
  isLoading: true,
  isConfigured: false,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithEmail: async () => ({ error: 'Supabase not configured' }),
  signUpWithEmail: async () => ({ error: 'Supabase not configured' }),
  signInWithOAuth: async () => ({ error: 'Supabase not configured' }),
  signOut: async () => {},
  refreshWorkspace: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const configured = isSupabaseConfigured();

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loadUserProfileAndWorkspace = useCallback(async (sbUser: SupabaseUser) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      // 1. Fetch or create profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      const resolvedName =
        profile?.name ||
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'Freelancer';

      const appUser: User = {
        id: sbUser.id,
        name: resolvedName,
        email: sbUser.email || '',
        avatarUrl: profile?.avatar_url || sbUser.user_metadata?.avatar_url,
        createdAt: profile?.created_at || sbUser.created_at || new Date().toISOString(),
      };
      setUser(appUser);

      // 2. Fetch workspace membership
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', sbUser.id)
        .limit(1);

      let activeWorkspace: Workspace | null = null;

      if (memberships && memberships.length > 0) {
        const wsId = memberships[0].workspace_id;
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', wsId)
          .single();

        if (wsData) {
          activeWorkspace = {
            id: wsData.id,
            name: wsData.name,
            ownerId: wsData.owner_id,
            currency: wsData.currency,
            createdAt: wsData.created_at,
          };
        }
      }

      // If user has no workspace yet (e.g. trigger failed or manual insert), provision one
      if (!activeWorkspace) {
        const { data: newWs, error: wsErr } = await supabase
          .from('workspaces')
          .insert({
            name: `${resolvedName}'s Studio`,
            currency: 'INR',
            owner_id: sbUser.id,
          })
          .select()
          .single();

        if (newWs && !wsErr) {
          await supabase.from('workspace_members').insert({
            workspace_id: newWs.id,
            user_id: sbUser.id,
            role: 'owner',
          });

          activeWorkspace = {
            id: newWs.id,
            name: newWs.name,
            ownerId: newWs.owner_id,
            currency: newWs.currency,
            createdAt: newWs.created_at,
          };
        }
      }

      setWorkspace(activeWorkspace);

      // Sync store with cloud workspace
      if (activeWorkspace) {
        await store.connectCloud(activeWorkspace.id, supabase);
      }
    } catch (err) {
      console.error('Error loading user profile or workspace:', err);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfileAndWorkspace(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadUserProfileAndWorkspace(newSession.user);
      } else {
        setUser(null);
        setWorkspace(null);
        store.disconnectCloud();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfileAndWorkspace]);

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Supabase is not configured' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message };
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Supabase is not configured' };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          full_name: name || email.split('@')[0],
        },
      },
    });

    return { error: error?.message };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Supabase is not configured' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });

    return { error: error?.message };
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setWorkspace(null);
    store.disconnectCloud();
  };

  const refreshWorkspace = async () => {
    if (session?.user) {
      await loadUserProfileAndWorkspace(session.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        session,
        isLoading,
        isConfigured: configured,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        refreshWorkspace,
      }}
    >
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
