'use client';

import DashboardLayout from '@/components/Layout/DashboardLayout';
import { NotesProvider } from '@/features/voice-notes/context/NotesContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: DashboardLayoutProps) {
  return (
    <NotesProvider
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your notes...</p>
          </div>
        </div>
      }
    >
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </NotesProvider>
  );
}

// Disable static optimization since dashboard requires authentication
export const dynamic = 'force-dynamic';