"use client";

import { useState, useEffect } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Calendar, Users, CalendarCheck, Trash2, AlertTriangle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventType, EventStatus } from "@/lib/schema";
import { EventValidationDialog } from "@/components/event-validation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: Date;
  endDate: Date | null;
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
  recurrenceEndDate: Date | null;
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
  status: EventStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  createdAt: Date;
  validated?: boolean | null;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
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
        "/api/events?filter=all&companyOnly=true"
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

  // Séparer les événements en à venir et passés
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastEvents = events
    .filter((event) => new Date(event.startDate) < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const handleView = (event: { id: number }) => {
    router.push(`/business/events/${event.id}`);
  };

  const handleEdit = (event: { id: number }) => {
    router.push(`/business/events/${event.id}/edit`);
  };

  const handleDeleteClick = (eventId: number) => {
    // Trouver l'événement à supprimer
    const event = events.find(e => e.id === eventId);
    if (!event) {
      toast({
        title: "Erreur",
        description: "Événement non trouvé",
        variant: "destructive",
      });
      return;
    }

    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const isRecurring = eventToDelete.recurrence && eventToDelete.recurrence !== "none";
        toast({
          title: "Succès",
          description: isRecurring
            ? "La série d'événements récurrents a été supprimée avec succès"
            : "L'événement a été supprimé avec succès",
        });
        fetchEvents(true);
        setDeleteDialogOpen(false);
        setEventToDelete(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression de l'événement",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Calcul des statistiques selon l'onglet actif
  const currentEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;
  const thisMonthEvents = currentEvents.filter((e) => {
    const eventDate = new Date(e.startDate);
    const now = new Date();
    return (
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear()
    );
  });
  const totalParticipants = currentEvents.reduce(
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
                  {activeTab === "upcoming" ? "Événements à venir" : "Événements passés"}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentEvents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {activeTab === "upcoming" ? "À venir ce mois" : "Passés ce mois"}
                </CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {thisMonthEvents.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des événements</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {events.length}
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

          {/* Onglets et liste des événements */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold">
                            Aucun événement à venir
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
                  upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Contenu onglet "Passés" */}
            <TabsContent value="past" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold">
                            Aucun événement passé
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            Vous n&apos;avez encore organisé aucun événement passé.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  pastEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {eventToDelete?.recurrence && eventToDelete.recurrence !== "none"
                ? "Supprimer la série d'événements"
                : "Supprimer l'événement"}
            </DialogTitle>
            <DialogDescription>
              {eventToDelete?.recurrence && eventToDelete.recurrence !== "none" ? (
                <>
                  <strong className="text-destructive">⚠️ ATTENTION :</strong> Cet événement fait partie d&apos;une série récurrente.
                  <br /><br />
                  La suppression supprimera <strong>TOUTE la série d&apos;événements récurrents</strong>, pas seulement celui-ci.
                  <br /><br />
                  <strong>Cette action est IRRÉVERSIBLE.</strong>
                  <br /><br />
                  Voulez-vous vraiment supprimer toute la série &ldquo;{eventToDelete.title}&rdquo; ?
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer l&apos;événement <strong>&ldquo;{eventToDelete?.title}&rdquo;</strong> ?
                  <br /><br />
                  Cette action est irrémédiable.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {eventToDelete?.recurrence && eventToDelete.recurrence !== "none"
                    ? "Supprimer la série"
                    : "Supprimer"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EventValidationDialog />
    </SidebarProvider>
  );
}
