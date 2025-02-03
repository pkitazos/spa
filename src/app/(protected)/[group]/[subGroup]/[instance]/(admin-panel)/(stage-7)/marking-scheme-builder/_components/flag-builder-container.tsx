"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { MainContentPanel } from "./main-content-panel";
import { SidePanel } from "./side-panel";

export function FlagBuilderContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex">
      <SidePanel onNewFlag={() => router.push("?flag=new")} />
      <MainContentPanel newFlag={searchParams.get("flag") === "new"} />
    </div>
  );
}
