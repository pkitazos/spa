"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { stripTrailingSlash } from "@/lib/utils/general/trim";
import { TabGroup, TabType } from "@/lib/validations/tabs";

import { Icon } from "./side-panel/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { useInstancePath } from "./params-context";

export default function InstanceSidebar({
  tabGroups,
  ...props
}: {
  tabGroups: TabGroup[];
} & React.ComponentProps<typeof Sidebar>) {
  const instancePath = useInstancePath();
  const path = usePathname();

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarContent className="gap-0 space-y-4">
        {tabGroups.map((group) => {
          if (group.tabs.length !== 0)
            return (
              <Collapsible
                key={group.title}
                title={group.title}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-foreground hover:text-accent-foreground"
                  >
                    <CollapsibleTrigger>
                      {group.title}{" "}
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.tabs.map((tab, i) => (
                          <TabButton
                            key={tab.title + i}
                            tab={tab}
                            currentPath={path}
                            instancePath={instancePath}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
        })}
      </SidebarContent>
    </Sidebar>
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
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={navPath}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "group max-h-max min-h-9 w-full justify-start text-[0.9rem] font-normal",
            currentPath === navPath && "bg-slate-300/50 text-accent-foreground",
          )}
        >
          {tab.icon && <Icon type={tab.icon} />}
          {tab.title}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
