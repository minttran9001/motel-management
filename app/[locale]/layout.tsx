import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/navigation";
import { Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import NavigationWrapper from "@/components/NavigationWrapper";
import { Toaster } from "@/components/ui/toaster";
import "../globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${manrope.variable} antialiased bg-blue-50`}
      >
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
            <Toaster />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
