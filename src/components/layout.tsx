// src/components/Layout.tsx
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}; 

export default Layout;