import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import { TRPCReactProvider } from "@/lib/trpc/client";

import "./app.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Allocation",
  description: "A web app for preference based matching",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-color-mode="light">
      <body className={inter.className}>
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <TRPCReactProvider>
              <Header />
              <main className="flex h-[92dvh] w-full flex-col justify-start gap-4 bg-background">
                <div className="ml-20 mt-7 flex items-center">
                  <Breadcrumbs />
                </div>
                <section className="mx-auto mt-1.5 flex h-full w-full justify-center 3xl:max-w-9xl">
                  {children}
                </section>
              </main>
              <Toaster position="bottom-right" />
            </TRPCReactProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
