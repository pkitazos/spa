"use client";
import { SlidersHorizontal } from "lucide-react";

import { api } from "@/lib/trpc/client";

import { InstanceLink } from "./instance-link";

export function AdminPanelButton() {
  const { status, data } = api.user.getAdminPanel.useQuery();

  if (status !== "success" || !data) return;
  // TODO: handle multiple admin panels
  return (
    <InstanceLink
      className="flex items-center gap-2 border"
      href={data[0]?.path ?? ""}
    >
      <SlidersHorizontal className="h-4 w-4" />
      My Admin Panel
    </InstanceLink>
  );
}
