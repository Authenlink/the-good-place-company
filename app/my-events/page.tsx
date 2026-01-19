"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useScroll } from "@/hooks/use-scroll";
import { Calendar } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface UserEvent {
  id: number;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  coverImage: string | null;
  backgroundType: "image" | "gradient" | null;
  backgroundImageIndex: number | null;
  backgroundGradient: {
    color1: string;
    color2: string;
    css: string;
  } | null;
  maxParticipants: number | null;
  recurrence: string | null;
  recurrenceEndDate: string | null;
  recurrenceGroupId: number | null;
  isPaid: boolean;
  price: string | null;
  currency: string;
  fundraisingGoal: string | null;
  requirements: string | null;
  targetAudience: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  externalLink: string | null;
  status: string;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  participantStatus: "confirmed" | "waitlisted";
  createdAt: string;
  updatedAt: string;
}

export default function MyEventsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const hasScrolled = useScroll();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchUserEvents = async () => {
      try {
        const response = await fetch("/api/user/events");
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else if (response.status === 401) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserEvents();
    }
  }, [session, sessionStatus, router]);

  // Séparer les événements en à venir et passés
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const pastEvents = events
    .filter((event) => new Date(event.startDate) < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Convertir les dates string en Date pour EventCard
  const convertEventForCard = (event: UserEvent) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
  });

  if (sessionStatus === "loading" || loading) {
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
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
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
                  <BreadcrumbPage>Mes évènements</BreadcrumbPage>
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
              <h1 className="text-3xl font-bold">Mes évènements</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Gérez vos inscriptions aux événements solidaires
            </p>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">
                À venir ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passés ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* Contenu onglet "À venir" */}
            <TabsContent value="upcoming" className="mt-6">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">
                        Aucun événement à venir
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Vous n'êtes inscrit à aucun événement à venir pour le moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {upcomingEvents.map((event, index) => (
                    <div key={`${event.id}-upcoming-${index}`} className="h-full">
                      <EventCard
                        event={convertEventForCard(event)}
                        participantStatus={event.participantStatus}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contenu onglet "Passés" */}
            <TabsContent value="past" className="mt-6">
              {pastEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">
                        Aucun événement passé
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Vous n'avez pas encore participé à d'événements.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {pastEvents.map((event, index) => (
                    <div key={`${event.id}-past-${index}`} className="h-full">
                      <EventCard
                        event={convertEventForCard(event)}
                        participantStatus={event.participantStatus}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
