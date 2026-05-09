"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSessionUser } from "@/lib/hooks";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sessionUser = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (AUTH_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        sessionUser={sessionUser}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-[272px]">
        <Navbar
          sessionUser={sessionUser}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <div className="px-4 py-5 lg:px-8 lg:py-8">
          <main className="mx-auto max-w-7xl">{children}</main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
