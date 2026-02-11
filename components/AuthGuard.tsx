'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from '@/components/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログインページではAuthGuardをスキップ
    if (pathname === '/admin/login') {
      setLoading(false);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase/client');
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/admin/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // セッション変更を監視（動的インポートで安全に）
    let subscription: any = null;
    const setupListener = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase/client');
        const supabase = getSupabase();
        const { data } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
              setIsAuthenticated(false);
              router.replace('/admin/login');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setIsAuthenticated(true);
            }
          }
        );
        subscription = data.subscription;
      } catch (error) {
        console.error('Failed to setup auth listener:', error);
      }
    };

    setupListener();

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500 text-sm">認証を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
