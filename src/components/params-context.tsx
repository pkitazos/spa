"use client";

import { createContext, type ReactNode, useContext } from "react";

import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";

import { type Role, type Stage } from "@/db/types";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { type InstanceParams } from "@/lib/validations/params";

type InstanceData = { params: InstanceParams; stage: Stage; roles: Set<Role> };

const InstanceContext = createContext<InstanceData | undefined>(undefined);

// move this stuff

export function InstanceParamsProvider({
  children,
  instance,
}: {
  children: ReactNode;
  instance: InstanceData;
}) {
  return (
    <InstanceContext.Provider value={instance}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstanceParams() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Missing InstanceParamsProvider in the tree");
  return instance.params;
}

export function useInstancePath() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Missing InstanceParamsProvider in the tree");
  return formatParamsAsPath(instance.params);
}

export function usePathInInstance() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Missing InstanceParamsProvider in the tree");

  return {
    basePath: formatParamsAsPath(instance.params),
    getPath: (path: string) => `${formatParamsAsPath(instance.params)}/${path}`,
    getInstancePath: (paths: string[], queryParams?: string) =>
      `${formatParamsAsPath(instance.params)}/${paths.join("/")}${queryParams ? `?${queryParams}` : ""}`,
  };
}

export function useInstanceStage() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Missing InstanceParamsProvider in the tree");
  return instance.stage;
}

export function useInstanceRoles() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Missing InstanceParamsProvider in the tree");
  return instance.roles;
}

export function InstanceHomeRedirectButton() {
  const instancePath = useInstancePath();
  return (
    <Link
      href={instancePath}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
      prefetch={false}
    >
      <ArrowUpLeft className="h-4 w-4" />
      <span>Go to Instance Home</span>
    </Link>
  );
}
