"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { stripTrailingSlash } from "@/lib/utils/general/trim";
import { type TabGroup, type TabType } from "@/lib/validations/tabs";

import { useInstancePath } from "../params-context";

import { Icon } from "./icons";

export default function SidePanel({ tabGroups }: { tabGroups: TabGroup[] }) {
  const instancePath = useInstancePath();
  const path = usePathname();

  return (
    <div className="flex w-full flex-col">
      <div className="space-y-4">
        {tabGroups.map((group) => {
          if (group.tabs.length !== 0)
            return (
              <div key={group.title}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {group.title}
                </h2>
                <div className="space-y-1">
                  {group.tabs.map((tab, i) => (
                    <TabButton
                      key={tab.title + i}
                      tab={tab}
                      currentPath={path}
                      instancePath={instancePath}
                    />
                  ))}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}

function TabButton({
  tab,
  instancePath,
  currentPath,
}: {
  tab: TabType;
  instancePath: string;
  currentPath: string;
}) {
  const navPath = stripTrailingSlash(`${instancePath}/${tab.href}`);
  return (
    <Link
      href={navPath}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "group max-h-max min-h-9 w-full justify-start text-[0.9rem] font-normal",
        currentPath === navPath && "bg-accent text-accent-foreground",
      )}
    >
      {tab.icon && <Icon type={tab.icon} />}
      {tab.title}
    </Link>
  );
}
