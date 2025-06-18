
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false, className }) => {
  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-background ${className || ''}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
              <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold">ระบบบริหารจัดการคิว</h1>
                </div>
              </div>
            </header>
            <main className={`flex-1 overflow-auto ${fullWidth ? 'w-full px-4 py-6' : 'container mx-auto px-4 py-6'}`}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
