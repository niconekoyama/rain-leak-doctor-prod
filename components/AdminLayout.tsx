'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { getSupabase } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/customers', label: '顧客管理', icon: Users },
  { href: '/admin/settings', label: '設定', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex">
        {/* モバイルオーバーレイ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* サイドバー */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* ロゴ */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F4C81] to-[#0A2540] flex items-center justify-center text-white font-bold text-xs">
                AI
              </div>
              <span className="font-bold text-[#0F4C81]">管理画面</span>
            </Link>
            <button
              className="lg:hidden p-1 rounded hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[#0F4C81]/10 text-[#0F4C81]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* フッター */}
          <div className="p-3 border-t border-slate-200 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <Home className="h-5 w-5 text-slate-400" />
              ホームに戻る
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-5 w-5 text-red-400" />
              {loggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* モバイルヘッダー */}
          <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4">
            <button
              className="p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <span className="ml-3 font-bold text-[#0F4C81]">管理画面</span>
          </header>

          {/* ページコンテンツ */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
