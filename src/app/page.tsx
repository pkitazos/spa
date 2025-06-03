import { Metadata } from "next";

import { Separator } from "@/components/ui/separator";
import { UserInstances } from "@/components/user-instances";

import { auth } from "@/lib/auth";

import { app, metadataTitle } from "@/config/meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: metadataTitle(["Home", app.name]) };

export default async function Home() {
  const user = await auth();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
      <h1 className="flex flex-col items-center gap-3 font-medium">
        <p className="text-4xl">
          Welcome{" "}
          <span className="font-mono font-semibold tracking-tighter text-indigo-600">
            {user.name}
          </span>
          !
        </p>
        <p className="text-3xl text-slate-500">
          to the SoCS project allocation system
        </p>
      </h1>
      <Separator className="my-4 w-1/3" />
      {user && (
        <div className="absolute bottom-0 w-full max-w-5xl">
          <UserInstances />
        </div>
      )}
    </div>
  );
}
