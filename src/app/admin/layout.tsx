import type { ReactNode } from 'react';
import '../globals.css';
import './theme.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}


