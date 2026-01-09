"use client";

import { useState, useEffect } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Calendar, Users, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EventType, EventStatus } from "@/lib/schema";

interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  maxParticipants: number | null;
  isPaid: boolean;
  price: string | null;
  currency: string;
  status: EventStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  createdAt: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasScrolled = useScroll();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchEvents();
  }, [session, status, router]);

  const fetchEvents = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        "/api/events?filter=upcoming&companyOnly=true"
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleView = (event: Event) => {
    router.push(`/business/events/${event.id}`);
  };

  const handleEdit = (event: Event) => {
    router.push(`/business/events/${event.id}/edit`);
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents(true);
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression de l'événement");
    }
  };

  // Calcul des statistiques
  const upcomingEvents = events.filter(
    (e) => new Date(e.startDate) >= new Date()
  );
  const thisMonthEvents = events.filter((e) => {
    const eventDate = new Date(e.startDate);
    const now = new Date();
    return (
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear()
    );
  });
  const totalParticipants = events.reduce(
    (acc, e) => acc + e.participantCount,
    0
  );

  if (status === "loading" || loading) {
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
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BreadcrumbPage>Événements</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Événements</h1>
              <p className="text-muted-foreground">
                Gérez vos événements et suivez les inscriptions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => fetchEvents(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button onClick={() => router.push("/business/events/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel événement
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des événements
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">À venir</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {upcomingEvents.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {thisMonthEvents.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participants inscrits
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalParticipants}</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des événements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">
                        Aucun événement pour le moment
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Créez votre premier événement pour engager votre
                        communauté et organiser des actions solidaires.
                      </p>
                      <Button
                        onClick={() => router.push("/business/events/create")}
                        size="lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer mon premier événement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    startDate: new Date(event.startDate),
                    endDate: event.endDate ? new Date(event.endDate) : null,
                  }}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
