"use client";

import * as React from "react";
import Image from "next/image";
import {
  BarChart3,
  Calendar,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
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
    title: "Tableau de bord",
    url: "/business/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Événements",
    url: "/business/events",
    icon: Calendar,
    items: [
      {
        title: "Tous les événements",
        url: "/business/events",
      },
      {
        title: "Créer un événement",
        url: "/business/events/create",
      },
      {
        title: "Événements passés",
        url: "/business/events/past",
      },
    ],
  },
  {
    title: "Projets",
    url: "/business/projects",
    icon: FolderKanban,
    items: [
      {
        title: "Tous les projets",
        url: "/business/projects",
      },
      {
        title: "Créer un projet",
        url: "/business/projects/create",
      },
      {
        title: "Archivés",
        url: "/business/projects/archived",
      },
    ],
  },
  {
    title: "Posts",
    url: "/business/posts",
    icon: MessageSquare,
    items: [
      {
        title: "Tous les posts",
        url: "/business/posts",
      },
      {
        title: "Créer un post",
        url: "/business/posts/create",
      },
    ],
  },
  {
    title: "Abonnés",
    url: "/business/followers",
    icon: Users,
    items: [
      {
        title: "Tous les abonnés",
        url: "/business/followers",
      },
      {
        title: "Statistiques",
        url: "/business/followers/insights",
      },
    ],
  },
  {
    title: "Analyses",
    url: "/business/analytics",
    icon: BarChart3,
    disabled: true,
    comingSoon: true,
  },
  {
    title: "Paramètres",
    url: "/business/settings",
    icon: Settings,
    items: [
      {
        title: "Profil entreprise",
        url: "/business/settings/profile",
      },
      {
        title: "Compte utilisateur",
        url: "/business/settings/user-account",
      },
    ],
  },
];

export function BusinessSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || "Business",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/business/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="The Good Place Company"
                    width={36}
                    height={36}
                    className="rounded-md"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">The Good Place</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Portail Entreprise
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
