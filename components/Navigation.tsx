"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Navigation() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Update CSS variable for main content margin
  useEffect(() => {
    const updateSidebarWidth = () => {
      if (typeof window === "undefined") return;
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        const sidebarWidth = isCollapsed ? "80px" : "320px";
        document.documentElement.style.setProperty(
          "--sidebar-width",
          sidebarWidth
        );
      } else {
        // On mobile, no margin when sidebar is closed
        document.documentElement.style.setProperty("--sidebar-width", "0px");
      }
    };

    // Set initial width immediately
    updateSidebarWidth();

    // Also set on next tick to ensure DOM is ready
    const timeoutId = setTimeout(updateSidebarWidth, 10);

    // Update on resize
    window.addEventListener("resize", updateSidebarWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateSidebarWidth);
    };
  }, [isCollapsed]);

  const navItems = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/room-status",
      label: t("roomStatus"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      href: "/expenses",
      label: t("expenses"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: "/history",
      label: t("history"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      href: "/rooms",
      label: t("rooms"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H5a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      href: "/hourly-pricing",
      label: t("hourlyPricing"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: "/price-calculator",
      label: t("priceCalculator"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      href: "/discounts",
      label: t("discounts"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
    {
      href: "/extras",
      label: t("extras"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      href: "/revenue-summary",
      label: t("revenueSummary"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      href: "/debts",
      label: t("debts"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2 0 1.105.895 2 2 2h1a2 2 0 110 4h-1m0-8V6m0 12h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
          />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (!session) {
    if (pathname.includes("/login")) return null;
    return (
      <div className="fixed top-4 right-4 z-[100]">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-blue-800 bg-blue-500 rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[110] p-2 rounded-lg bg-white shadow-md text-gray-500 hover:text-blue-400 transition-colors"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-400 bg-opacity-40 backdrop-blur-sm z-[100] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-[105] ${
          isCollapsed ? "w-20" : "w-80"
        } transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div
          className={`p-6 border-b border-gray-100 flex items-center gap-3 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            M
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {t("title")}
            </h1>
          )}
          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block ml-auto p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all group ${
                isCollapsed ? "justify-center" : ""
              } ${
                pathname === item.href
                  ? "bg-blue-100 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:bg-blue-50 hover:text-gray-700"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span
                className={`transition-colors shrink-0 ${
                  pathname === item.href
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-blue-400"
                }`}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div
          className={`p-4 border-t border-gray-100 space-y-4 ${
            isCollapsed ? "px-2" : ""
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t("language")}
              </span>
              <Link
                href={pathname}
                locale={locale === "en" ? "vi" : "en"}
                className="px-2 py-1 text-[10px] font-black uppercase rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {locale === "en" ? "🇻🇳 VI" : "🇬🇧 EN"}
              </Link>
            </div>
          )}

          <div
            className={`bg-blue-50 rounded-2xl p-4 flex items-center gap-3 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 font-bold text-sm border-2 border-white shadow-sm shrink-0">
              {session.user?.name?.[0] || "U"}
            </div>
            {!isCollapsed && (
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
