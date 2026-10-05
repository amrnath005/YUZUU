"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { Cloud, Lock, Mail, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isConfigured } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          toast.success('Signed in successfully');
          onClose();
        }
      } else {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          toast.success('Account created! Signed in to cloud workspace.');
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'OAuth sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--color-yuzu)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              YUZU CLOUD
            </span>
          </div>
          <h2 className="text-xl font-medium tracking-tight text-[var(--color-text-primary)]">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your cloud account'}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {mode === 'signin'
              ? 'Access your clients, deliverables, and payments from any device.'
              : 'Start tracking work and payments with cloud backup and PostgreSQL isolation.'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-3.5 py-4">
            {!isConfigured && (
              <div className="p-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 text-xs text-[var(--color-text-secondary)] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Development Setup</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Supabase credentials are not configured in your environment yet. Add <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> to activate live cloud syncing.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-xs text-[var(--color-danger)]">
                {errorMsg}
              </div>
            )}

            {mode === 'signup' && (
              <Input
                label="Your Name"
                placeholder="Sahil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                prefixIcon={<UserIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="sahil@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              prefixIcon={<Mail className="w-4 h-4 text-[var(--color-text-secondary)]" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              prefixIcon={<Lock className="w-4 h-4 text-[var(--color-text-secondary)]" />}
            />

            {isConfigured && (
              <div className="pt-1">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--color-border)]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-secondary)]">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                >
                  <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </Button>
                <p className="text-[10.5px] text-center text-[var(--color-text-secondary)] mt-2">
                  Use Email &amp; Password for instant access (or enable Google OAuth in Supabase dashboard).
                </p>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg(null);
              }}
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                disabled={!isConfigured}
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
