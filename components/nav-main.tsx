"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup, SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "@/components/notification-badge";
import { Bell } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    disabled?: boolean;
    comingSoon?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // Items without sub-items: direct link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                {item.disabled || item.comingSoon ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="cursor-not-allowed opacity-60"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.comingSoon && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px] px-1.5 py-0"
                      >
                        Prochainement
                      </Badge>
                    )}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url} className="flex items-center gap-2 w-full relative">
                      {item.title === "Notifications" ? (
                        <>
                          <div className="relative flex items-center justify-center">
                            <Bell className="h-4 w-4 relative z-10" />
                            {isCollapsed && <NotificationBadge isCollapsed={isCollapsed} />}
                          </div>
                          {!isCollapsed && (
                            <>
                              <span>Notifications</span>
                              <NotificationBadge isCollapsed={isCollapsed} />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {item.icon && <item.icon />}
                          {!isCollapsed && <span>{item.title}</span>}
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          }

          // Items with sub-items: collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
