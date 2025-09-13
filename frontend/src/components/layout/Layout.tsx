import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Red Team AI Agent</h1>
      </nav>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}