'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { ToastProvider } from '@/components/AdminUI';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminLayout>{children}</AdminLayout>
    </ToastProvider>
  );
}
