"use client";

import { usePathname } from "@/i18n/navigation";
import Navigation from "./Navigation";

const ROUTES_TO_HIDE_SIDEBAR = ["/login"];

export default function NavigationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = ROUTES_TO_HIDE_SIDEBAR.includes(pathname);

  return (
    <div className="flex min-h-screen">
      {!hideSidebar && <Navigation />}
      <main
        className={`flex-1 transition-all duration-300 bg-blue-50 ${
          !hideSidebar ? "has-sidebar" : ""
        }`}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
