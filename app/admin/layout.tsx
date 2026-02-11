'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { ToastProvider } from '@/components/AdminUI';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ログインページの場合はAdminLayout（AuthGuard含む）をスキップ
  if (pathname === '/admin/login') {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AdminLayout>{children}</AdminLayout>
    </ToastProvider>
  );
}
