"use client";

import { useEffect, useState } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { EVENT_TYPES } from "@/lib/schema";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  maxParticipants: number | null;
  isPaid: boolean;
  price: string | null;
  currency: string;
  status: string;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  createdAt: string;
  type?: string;
  date?: Date;
}

export default function EventsPage() {
  const hasScrolled = useScroll();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events?filter=all");
        if (response.ok) {
          const data = await response.json();
          // Filtrer seulement les événements publiés
          const publishedEvents = data.filter(
            (event: { status?: string }) => event.status === "published"
          );
          setEvents(publishedEvents);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filtrage des événements
  const filteredEvents =
    selectedFilter === "all"
      ? events
      : events.filter((event) => event.eventType === selectedFilter);

  // Tri par date (plus récent en premier)
  const sortedEvents = filteredEvents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12`}
          >
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Chargement des événements...
              </p>
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
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Événements</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header avec titre */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Événements</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Découvrez tous les événements solidaires et rejoignez la
              communauté
            </p>
          </div>

          {/* Filtres par type d'événement */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Filtrer par type :
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                className="h-8"
              >
                Tous ({events.length})
              </Button>
              {Object.entries(EVENT_TYPES).map(([key, value]) => {
                const count = events.filter(
                  (event) => event.eventType === key
                ).length;
                return (
                  <Button
                    key={key}
                    variant={selectedFilter === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(key)}
                    className="h-8"
                    disabled={count === 0}
                  >
                    {value} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Liste des événements */}
          {sortedEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">
                    {selectedFilter === "all"
                      ? "Aucun événement disponible"
                      : `Aucun événement de type ${
                          EVENT_TYPES[
                            selectedFilter as keyof typeof EVENT_TYPES
                          ] || selectedFilter
                        }`}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {selectedFilter === "all"
                      ? "Il n'y a pas d'événements publiés pour le moment."
                      : "Essayez de changer le filtre pour voir d'autres types d'événements."}
                  </p>
                  {selectedFilter !== "all" && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFilter("all")}
                    >
                      Voir tous les événements
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
