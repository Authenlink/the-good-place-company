"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  className?: string;
  isCollapsed?: boolean;
}

export function NotificationBadge({ className, isCollapsed = false }: NotificationBadgeProps) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du compteur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [session]);

  if (loading || !session?.user || unreadCount === 0) {
    return null;
  }

  // Badge pour sidebar fermée (collapsed) - positionné en haut à droite de l'icône, peut se chevaucher
  if (isCollapsed) {
    return (
      <Badge
        className={cn(
          "absolute -top-0.5 -right-0.5 h-3 min-w-3 flex items-center justify-center p-0 text-[8px] font-semibold bg-primary text-background border-0 leading-none z-0",
          className
        )}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    );
  }

  // Badge pour sidebar ouverte (expanded) - positionné à droite avec ml-auto
  return (
    <Badge
      className={cn(
        "ml-auto h-3.5 min-w-3.5 flex items-center justify-center px-1 text-[9px] font-semibold bg-primary text-background border-0 leading-none",
        className
      )}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
