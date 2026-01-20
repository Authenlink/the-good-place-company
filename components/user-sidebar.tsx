"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Compass,
  LayoutDashboard,
  MapPin,
  Newspaper,
  User,
  Users,
  Bell,
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
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Actualités",
    url: "/feed",
    icon: Newspaper,
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
        url: "/events-calendar",
      },
      {
        title: "Mes évènements",
        url: "/my-events",
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
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
];

export function UserSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [backgroundGradient, setBackgroundGradient] = useState<{
    color1: string;
    color2: string;
    css: string;
  } | null>(null);

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  // Charger le gradient de l'utilisateur
  useEffect(() => {
    const loadUserGradient = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.backgroundType === "gradient" && data.backgroundGradient) {
            setBackgroundGradient(data.backgroundGradient);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du gradient:", error);
      }
    };

    if (session?.user) {
      loadUserGradient();
    }
  }, [session]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
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
        <NavUser
          user={user}
          accountType="user"
          backgroundGradient={backgroundGradient}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
