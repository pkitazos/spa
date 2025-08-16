"use client";

import * as React from "react";

import { HomeIcon, LifeBuoyIcon } from "lucide-react";
import Link from "next/link";

import { app } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { CopyButton } from "@/components/copy-button";
import { usePathInInstance } from "@/components/params-context";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import SidebarTabs from "./sidebar-tabs";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  instanceName: string;
  tabGroups: {
    title: string;
    tabs: { title: string; href: string; icon?: string | undefined }[];
  }[];
}

export function AppSidebar({
  instanceName,
  tabGroups,
  ...props
}: AppSidebarProps) {
  const { basePath } = usePathInInstance();
  return (
    <Sidebar
      className="top-[calc(var(--header-height)-1px)] h-[calc(100svh-var(--header-height))]! fixed"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={basePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <HomeIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {PAGES.instanceHome.title}
                  </span>
                  <span className="truncate text-xs">{instanceName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator className="w-5/6 mx-auto" />
      <SidebarTabs tabGroups={tabGroups} />
      <Separator className="w-5/6 mx-auto" />
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <Dialog>
            <DialogTrigger asChild>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LifeBuoyIcon />
                  <span>Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="space-y-5">
                <DialogTitle>Need to contact us?</DialogTitle>
                <DialogDescription>
                  Send us an email at:{" "}
                  <code className="flex items-center gap-1.5">
                    {app.supportEmail}
                    <CopyButton
                      data={app.supportEmail}
                      message="support email"
                    />
                  </code>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          {/* <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href="#">
                <SendIcon />
                <span>Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          {/* <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/docs">
                <BookMarkedIcon />
                <span>Docs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
