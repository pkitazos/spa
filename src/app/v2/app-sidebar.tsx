"use client";

import * as React from "react";

import {
  BookMarkedIcon,
  BookOpen,
  Bot,
  Frame,
  HomeIcon,
  LifeBuoyIcon,
  PieChart,
  SendIcon,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";

import { app } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { CopyButton } from "@/components/copy-button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavMain } from "./nav/main";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "#", icon: LifeBuoyIcon },
    { title: "Feedback", url: "#", icon: SendIcon },
    { title: "Docs", url: "/docs", icon: BookMarkedIcon },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-[calc(var(--header-height)-1px)] !h-[calc(100svh-var(--header-height))] fixed"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <HomeIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {PAGES.instanceHome.title}
                  </span>
                  <span className="truncate text-xs">2025-2026</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
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
                    {app.supportMail}
                    <CopyButton
                      data={app.supportMail}
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/docs">
                <BookMarkedIcon />
                <span>Docs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
