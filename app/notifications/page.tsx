"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useScroll } from "@/hooks/use-scroll";
import {
    Bell,
    CheckCheck,
    Trash2, Building2,
    Heart,
    MessageSquare,
    Calendar,
    UserPlus,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedUserId?: number;
  relatedCompanyId?: number;
  relatedPostId?: number;
  relatedEventId?: number;
  relatedCommentId?: number;
  relatedEventCommentId?: number;
  relatedParticipantId?: number;
  relatedUser?: {
    id: number;
    name: string | null;
    image: string | null;
  };
  relatedCompany?: {
    id: number;
    name: string | null;
    logo: string | null;
  };
  relatedPost?: {
    id: number;
    content: string | null;
  };
  relatedEvent?: {
    id: number;
    title: string | null;
  };
}

const NOTIFICATION_TYPES = {
  company_followed: { label: "Suivi d'entreprise", icon: Building2 },
  event_registration: { label: "Inscription", icon: Calendar },
  post_liked: { label: "Like sur post", icon: Heart },
  event_liked: { label: "Like sur événement", icon: Heart },
  post_commented: { label: "Commentaire sur post", icon: MessageSquare },
  event_commented: { label: "Commentaire sur événement", icon: MessageSquare },
  user_followed: { label: "Suivi utilisateur", icon: UserPlus },
  comment_liked: { label: "Like sur commentaire", icon: Heart },
  event_comment_liked: { label: "Like sur commentaire", icon: Heart },
  event_registration_confirmed: { label: "Inscription confirmée", icon: CheckCircle },
  event_registration_rejected: { label: "Inscription refusée", icon: XCircle },
  event_registration_waitlisted: { label: "Liste d'attente", icon: Clock },
};

function getNotificationLink(notification: Notification): string {
  if (notification.relatedPostId) {
    return `/feed`;
  }
  if (notification.relatedEventId) {
    return `/events/${notification.relatedEventId}`;
  }
  if (notification.relatedUserId) {
    return `/user/${notification.relatedUserId}`;
  }
  if (notification.relatedCompanyId) {
    return `/associations/${notification.relatedCompany?.name || notification.relatedCompanyId}`;
  }
  return "/notifications";
}

function getNotificationIcon(type: string) {
  const typeConfig = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
  if (typeConfig) {
    const Icon = typeConfig.icon;
    return <Icon className="h-5 w-5" />;
  }
  return <Bell className="h-5 w-5" />;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isScrolled = useScroll();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      if (unreadOnly) {
        params.append("unreadOnly", "true");
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session, page, filterType, unreadOnly, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setMarkingAsRead(notificationId);
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast({
          title: "Succès",
          description: "Toutes les notifications ont été marquées comme lues",
        });
      }
    } catch (error) {
      console.error("Erreur lors du marquage:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast({
          title: "Succès",
          description: "Notification supprimée",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    setPage(1);
  };

  const handleUnreadToggle = (checked: boolean) => {
    setUnreadOnly(checked);
    setPage(1);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (status === "loading") {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={`sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all ${
            isScrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="container flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Notifications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Aucune notification non lue"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" className="w-full sm:w-auto">
                <CheckCheck className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Marquer tout lu</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={unreadOnly ? "default" : "outline"}
              onClick={() => handleUnreadToggle(!unreadOnly)}
              className="w-full sm:w-auto"
            >
              {unreadOnly ? "Afficher tout" : "Non lues uniquement"}
            </Button>
          </div>

          <div className="space-y-2">
            {loading && notifications.length === 0 ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucune notification</p>
                  <p className="text-sm text-muted-foreground">
                    Vous n&apos;avez pas encore de notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.read ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        {notification.relatedUser?.image ? (
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage
                              src={notification.relatedUser.image}
                              alt={notification.relatedUser.name || ""}
                            />
                            <AvatarFallback>
                              {notification.relatedUser.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ) : notification.relatedCompany?.logo ? (
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage
                              src={notification.relatedCompany.logo}
                              alt={notification.relatedCompany.name || ""}
                            />
                            <AvatarFallback>
                              {notification.relatedCompany.name?.[0] || "C"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={getNotificationLink(notification)}
                              className="block"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                              }}
                            >
                              <p className="text-sm font-medium leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: fr,
                                  }
                                )}
                              </p>
                            </Link>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 flex-shrink-0">
                            {!notification.read && (
                              <Badge variant="default" className="text-xs flex-shrink-0">
                                Nouveau
                              </Badge>
                            )}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                disabled={markingAsRead === notification.id}
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification.id)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {hasMore && !loading && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                Charger plus
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
