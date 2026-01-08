"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  Home,
  Heart,
  Settings,
  Ticket,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Feed",
    url: "/feed",
    icon: Home,
    isActive: true,
    items: [
      {
        title: "For You",
        url: "/feed",
      },
      {
        title: "Latest",
        url: "/feed/latest",
      },
    ],
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
    items: [
      {
        title: "Discover",
        url: "/events",
      },
      {
        title: "My Registrations",
        url: "/events/registered",
      },
      {
        title: "Saved",
        url: "/events/saved",
      },
    ],
  },
  {
    title: "Companies",
    url: "/companies",
    icon: Building2,
    items: [
      {
        title: "Discover",
        url: "/companies",
      },
      {
        title: "Following",
        url: "/companies/following",
      },
    ],
  },
  {
    title: "My Activity",
    url: "/activity",
    icon: Ticket,
    items: [
      {
        title: "Registrations",
        url: "/activity/registrations",
      },
      {
        title: "Favorites",
        url: "/activity/favorites",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    items: [
      {
        title: "Profile",
        url: "/settings/profile",
      },
      {
        title: "Notifications",
        url: "/settings/notifications",
      },
      {
        title: "Privacy",
        url: "/settings/privacy",
      },
    ],
  },
];

export function UserSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/feed">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Heart className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">The Good Place</span>
                  <span className="truncate text-xs text-muted-foreground">
                    User Account
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
