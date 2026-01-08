"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FolderKanban,
  Users,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import { EventType } from "@/lib/schema";
import {
  EventCalendar,
  EventCalendarSkeleton,
  type CalendarEvent,
} from "@/components/event-calendar";
import { useScroll } from "@/hooks/use-scroll";

interface Event {
  id: number;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  city?: string | null;
  status: string;
  participantCount: number;
  maxParticipants?: number | null;
}

interface Post {
  id: number;
  content: string;
  createdAt: string;
}

export default function BusinessDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasScrolled = useScroll();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (
      status === "authenticated" &&
      session?.user?.accountType !== "business"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsResponse = await fetch("/api/events?companyOnly=true");
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }

      // Fetch posts
      const postsResponse = await fetch("/api/posts");
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData);
      }

      // Fetch projects count
      const projectsResponse = await fetch(
        "/api/projects?companyOnly=true&status=active"
      );
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjectsCount(projectsData.length);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convertir les événements pour le calendrier
  const calendarEvents: CalendarEvent[] = events
    .filter((e) => e.status === "published")
    .map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      city: e.city,
      participantCount: e.participantCount,
      maxParticipants: e.maxParticipants,
      status: e.status,
    }));

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/business/events/${event.id}`);
  };

  if (status === "loading") {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-32" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EventCalendarSkeleton />
              </div>
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session || session.user.accountType !== "business") {
    return null;
  }

  // Calculer les stats
  const upcomingEvents = events.filter(
    (e) => new Date(e.startDate) >= new Date() && e.status === "published"
  );
  const totalParticipants = events.reduce(
    (acc, e) => acc + (e.participantCount || 0),
    0
  );

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
            hasScrolled ? "border-b" : ""
          }`}
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/business/dashboard">
                    Business Portal
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Bienvenue, {session.user.name} ! Gérez vos événements et votre
              communauté.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Événements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Événements
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-12" /> : events.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {upcomingEvents.length} à venir
                </p>
              </CardContent>
            </Card>

            {/* 2. Projets */}
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/business/projects")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projets actifs
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-12" /> : projectsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Projets en cours
                </p>
              </CardContent>
            </Card>

            {/* 3. Posts */}
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/business/posts")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-12" /> : posts.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Publications totales
                </p>
              </CardContent>
            </Card>

            {/* 4. Participants / Followers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participants
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    totalParticipants
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inscrits aux événements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendrier et Posts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Calendrier des événements - 2/3 de la largeur */}
            <div className="lg:col-span-2">
              {loading ? (
                <EventCalendarSkeleton />
              ) : (
                <EventCalendar
                  events={calendarEvents}
                  loading={loading}
                  title="Calendrier des événements"
                  description="Vos événements à venir"
                  onEventClick={handleEventClick}
                  onCreateClick={() => router.push("/business/events/create")}
                />
              )}
            </div>

            {/* Posts récents - 1/3 de la largeur */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Posts récents</CardTitle>
                  <CardDescription>Vos dernières publications</CardDescription>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/business/posts/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Créer
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Aucun post publié
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/business/posts/create")}
                    >
                      Créer votre premier post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.slice(0, 4).map((post) => (
                      <div
                        key={post.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push("/business/posts")}
                      >
                        <p className="text-sm line-clamp-2">{post.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(post.createdAt), "d MMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    ))}
                    {posts.length > 4 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push("/business/posts")}
                      >
                        Voir tous les posts
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
