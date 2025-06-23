import { Metadata } from "next";

import { Separator } from "@/components/ui/separator";

import { app, metadataTitle } from "@/config/meta";
import { api } from "@/lib/trpc/server";
import UserSpacesGrid from "@/components/pages/landing-page/user-spaces-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: metadataTitle(["Home", app.name]) };

export default async function Home() {
  const user = await api.user.get();

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 pt-32">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          Welcome <span className="text-indigo-600">{user.name}</span>!
        </h1>
        <p className="text-xl text-gray-600">to the SoCS {app.descriptor}</p>
      </div>
      <Separator className="my-4 w-1/3" />
      <UserSpacesGrid />
      <div className="h-20">&nbsp;</div>
    </div>
  );
}
