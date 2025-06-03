import { Metadata } from "next";

import { auth } from "@/lib/auth";

import { app, metadataTitle } from "@/config/meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: metadataTitle(["Home", app.name]) };

export default async function Home() {
  const user = await auth();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
      <h1>Hello!</h1>
    </div>
  );
}
