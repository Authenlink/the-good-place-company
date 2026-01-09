"use client";

import * as React from "react";
import Image from "next/image";
import {
  Calendar,
  Compass,
  MapPin,
  Newspaper,
  User,
  Users,
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
    title: "Actualités",
    url: "/feed",
    icon: Newspaper,
    isActive: true,
  },
  {
    title: "Évènements",
    url: "/events",
    icon: Calendar,
    items: [
      {
        title: "Tous les évènements",
        url: "/events",
      },
      {
        title: "Calendrier des évènements",
        url: "/events/calendar",
      },
      {
        title: "Mes évènements",
        url: "/events/my-events",
      },
    ],
  },
  {
    title: "Associations",
    url: "/associations",
    icon: Users,
  },
  {
    title: "Découvrir",
    url: "/discover",
    icon: Compass,
  },
  {
    title: "Carte",
    url: "/map",
    icon: MapPin,
  },
  {
    title: "Profil",
    url: "/profile",
    icon: User,
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
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="The Good Place"
                    width={36}
                    height={36}
                    className="rounded-md"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">The Good Place</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Portail Utilisateur
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
        <NavUser user={user} accountType="user" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
