"use client";

import { usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import Navigation from "./Navigation";

export default function NavigationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoginPage = pathname?.includes("/login");
  const hasSidebar = session && !isLoginPage;

  return (
    <div className="flex min-h-screen">
      {hasSidebar && <Navigation />}
      <main
        className={`flex-1 transition-all duration-300 bg-blue-50 ${
          hasSidebar ? "has-sidebar" : ""
        }`}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
