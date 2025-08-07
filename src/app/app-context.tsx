import { type ReactNode } from "react";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { TRPCReactProvider } from "@/lib/trpc/client";

export function AppContext({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        forcedTheme="light"
        disableTransitionOnChange
      >
        <TRPCReactProvider>
          {children}
          <Toaster position="bottom-right" />
        </TRPCReactProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
