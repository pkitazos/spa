import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { app } from "@/config/meta";

import { AppContext } from "./app-context";
import "./app.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: app.name,
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
        <AppContext>{children}</AppContext>
      </body>
    </html>
  );
}
