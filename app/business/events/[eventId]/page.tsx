"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useScroll } from "@/hooks/use-scroll";
import {
  EVENT_TYPES,
  RECURRENCE_TYPES,
  EventType,
  EventStatus,
  ParticipantStatus,
} from "@/lib/schema";
import { cn } from "@/lib/utils";

// Couleurs par type d'événement
const eventTypeColors: Record<EventType, string> = {
  // Actions terrain
  maraude: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  distribution_alimentaire:
    "bg-green-500/10 text-green-600 border-green-500/20",
  distribution_vetements: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  action_ecologique: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  benevolat: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  // Collecte & Financement
  collecte_dons: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  collecte_fonds: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  soiree_caritative: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  vente_solidaire: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  concert_benefice: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  // Communauté
  repas_partage: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  atelier: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  sensibilisation: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  // Autre
  autre: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const statusColors: Record<EventStatus, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const statusLabels: Record<EventStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
  completed: "Terminé",
};

const participantStatusColors: Record<ParticipantStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  confirmed: "bg-green-500/10 text-green-600",
  waitlisted: "bg-orange-500/10 text-orange-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const participantStatusLabels: Record<ParticipantStatus, string> = {
  pending: "En attente de validation",
  confirmed: "Inscrit",
  waitlisted: "En attente",
  cancelled: "Annulé",
};

interface Participant {
  id: number;
  userId: number;
  status: ParticipantStatus;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

interface EventDetail {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  coordinates: { lat: number; lng: number } | null;
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
  status: EventStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  pendingCount?: number;
  participants: Participant[];
  currentUserStatus: ParticipantStatus | null;
  createdAt: string;
  updatedAt: string;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<{
    userId: number;
    userName: string | null;
  } | null>(null);
  const hasScrolled = useScroll();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchEvent();
  }, [session, status, router, resolvedParams.eventId]);

  const fetchEvent = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 404) {
        toast({
          title: "Événement non trouvé",
          description: "Cet événement n'existe pas ou a été supprimé.",
          variant: "destructive",
        });
        router.push("/business/events");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'événement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'événement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveParticipantClick = (userId: number, userName: string | null) => {
    setParticipantToRemove({ userId, userName });
    setRemoveDialogOpen(true);
  };

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    try {
      const response = await fetch(
        `/api/events/${resolvedParams.eventId}/participants?userId=${participantToRemove.userId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Participant retiré",
          description: "Le participant a été retiré de l'événement.",
        });
        fetchEvent(true);
        setRemoveDialogOpen(false);
        setParticipantToRemove(null);
      } else {
        throw new Error("Erreur lors du retrait");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le participant.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    // TODO: Implémenter la messagerie plus tard
    toast({
      title: "Fonctionnalité à venir",
      description: "La messagerie sera disponible prochainement.",
    });
  };

  const handleUpdateParticipantStatus = async (
    participantId: number,
    newStatus: ParticipantStatus
  ) => {
    try {
      const response = await fetch(
        `/api/events/${resolvedParams.eventId}/participants/${participantId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Statut mis à jour",
          description: data.message || "Le statut a été modifié avec succès.",
        });
        fetchEvent(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: (error as Error)?.message || "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Événement supprimé",
          description: "L'événement a été supprimé avec succès.",
        });
        router.push("/business/events");
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (newStatus: EventStatus) => {
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Statut mis à jour",
          description: `L'événement est maintenant "${statusLabels[newStatus]}".`,
        });
        fetchEvent(true);
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

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
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!event) {
    return null;
  }

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date();
  const confirmedParticipants = event.participants.filter(
    (p) => p.status === "confirmed"
  );
  const waitlistedParticipants = event.participants.filter(
    (p) => p.status === "waitlisted"
  );
  const pendingParticipants = event.participants.filter(
    (p) => p.status === "pending"
  );

  // Déterminer le background à afficher
  const getBackground = () => {
    if (event.backgroundType === "gradient" && event.backgroundGradient) {
      return {
        type: "gradient" as const,
        value: event.backgroundGradient.css,
      };
    }
    if (event.backgroundType === "image" && event.images && event.images.length > 0) {
      const imageIndex = event.backgroundImageIndex ?? 0;
      if (imageIndex >= 0 && imageIndex < event.images.length) {
        return {
          type: "image" as const,
          value: event.images[imageIndex],
        };
      }
    }
    if (event.coverImage) {
      return {
        type: "image" as const,
        value: event.coverImage,
      };
    }
    if (event.images && event.images.length > 0) {
      return {
        type: "image" as const,
        value: event.images[0],
      };
    }
    return null;
  };

  const background = getBackground();

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
                  <BreadcrumbLink href="/business/events">
                    Événements
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{event.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          {/* Header avec actions */}
          <div className="flex justify-between items-start gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/business/events")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => fetchEvent(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/business/events/${event.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image/Gradient et infos principales */}
              <Card className="overflow-hidden pt-0">
                {event.images && event.images.length > 0 ? (
                  <div className="relative h-64 w-full">
                    <Image
                      src={event.images[0]}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : background?.type === "gradient" ? (
                  <div
                    className="relative h-64 w-full"
                    style={{ background: background.value }}
                  />
                ) : null}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={eventTypeColors[event.eventType]}
                        >
                          {EVENT_TYPES[event.eventType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusColors[event.status]}
                        >
                          {statusLabels[event.status]}
                        </Badge>
                        {isPast && event.status === "published" && (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 text-gray-600"
                          >
                            Passé
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl">{event.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Infos date et lieu */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {format(startDate, "EEEE d MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {format(startDate, "HH:mm", { locale: fr })}
                          {endDate &&
                            ` - ${format(endDate, "HH:mm", { locale: fr })}`}
                        </span>
                      </div>
                      {event.recurrence && event.recurrence !== "none" && (
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 text-muted-foreground" />
                          <span>
                            {
                              RECURRENCE_TYPES[
                                event.recurrence as keyof typeof RECURRENCE_TYPES
                              ]
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(event.location || event.city) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            {event.location && <div>{event.location}</div>}
                            {event.address && (
                              <div className="text-sm text-muted-foreground">
                                {event.address}
                              </div>
                            )}
                            {event.city && (
                              <div className="text-sm text-muted-foreground">
                                {event.city}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {event.participantCount} inscrit
                          {event.participantCount > 1 ? "s" : ""}
                          {event.maxParticipants &&
                            ` / ${event.maxParticipants}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {event.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Liste des participants */}
              <Card>
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>
                    {event.participantCount} inscrit
                    {event.participantCount > 1 ? "s" : ""}
                    {event.waitlistCount > 0 &&
                      ` • ${event.waitlistCount} en liste d'attente`}
                    {pendingParticipants.length > 0 &&
                      ` • ${pendingParticipants.length} en attente de validation`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={pendingParticipants.length > 0 ? "pending" : "confirmed"}>
                    <TabsList className="mb-4">
                      {pendingParticipants.length > 0 && (
                        <TabsTrigger value="pending">
                          En attente ({pendingParticipants.length})
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="confirmed">
                        Inscrits ({confirmedParticipants.length})
                      </TabsTrigger>
                      <TabsTrigger value="waitlist">
                        Liste d&apos;attente ({waitlistedParticipants.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                      {pendingParticipants.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune candidature en attente de validation
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Participant</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Inscrit le</TableHead>
                              <TableHead className="w-[200px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingParticipants.map((participant) => (
                              <TableRow key={participant.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={participant.userImage || ""}
                                      />
                                      <AvatarFallback>
                                        {participant.userName
                                          ?.charAt(0)
                                          .toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {participant.userName || "Utilisateur"}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "w-fit mt-1",
                                          participantStatusColors[participant.status]
                                        )}
                                      >
                                        {participantStatusLabels[participant.status]}
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {participant.userEmail}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {format(
                                    new Date(participant.createdAt),
                                    "d MMM yyyy",
                                    { locale: fr }
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          `/user/${participant.userId}`,
                                          "_blank"
                                        )
                                      }
                                      title="Voir le profil"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateParticipantStatus(
                                          participant.id,
                                          "confirmed"
                                        )
                                      }
                                      title="Valider"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateParticipantStatus(
                                          participant.id,
                                          "cancelled"
                                        )
                                      }
                                      title="Refuser"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    <TabsContent value="confirmed">
                      {confirmedParticipants.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Aucun participant inscrit pour le moment
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Participant</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Inscrit le</TableHead>
                              <TableHead className="w-[200px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {confirmedParticipants.map((participant) => (
                              <TableRow key={participant.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={participant.userImage || ""}
                                      />
                                      <AvatarFallback>
                                        {participant.userName
                                          ?.charAt(0)
                                          .toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {participant.userName || "Utilisateur"}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "w-fit mt-1",
                                          participantStatusColors[participant.status]
                                        )}
                                      >
                                        {participantStatusLabels[participant.status]}
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {participant.userEmail}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {format(
                                    new Date(participant.createdAt),
                                    "d MMM yyyy",
                                    { locale: fr }
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          `/user/${participant.userId}`,
                                          "_blank"
                                        )
                                      }
                                      title="Voir le profil"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2 text-xs"
                                        >
                                          Gérer
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                          {participant.userName || "Utilisateur"}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={handleSendMessage}
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Envoyer un message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() =>
                                            handleRemoveParticipantClick(
                                              participant.userId,
                                              participant.userName
                                            )
                                          }
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Retirer de la liste
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    <TabsContent value="waitlist">
                      {waitlistedParticipants.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Personne en liste d&apos;attente
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Position</TableHead>
                              <TableHead>Participant</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Inscrit le</TableHead>
                              <TableHead className="w-[200px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {waitlistedParticipants.map(
                              (participant, index) => (
                                <TableRow key={participant.id}>
                                  <TableCell>#{index + 1}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={participant.userImage || ""}
                                        />
                                        <AvatarFallback>
                                          {participant.userName
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {participant.userName || "Utilisateur"}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "w-fit mt-1",
                                            participantStatusColors[participant.status]
                                          )}
                                        >
                                          {participantStatusLabels[participant.status]}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {participant.userEmail}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {format(
                                      new Date(participant.createdAt),
                                      "d MMM yyyy",
                                      { locale: fr }
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          window.open(
                                            `/user/${participant.userId}`,
                                            "_blank"
                                          )
                                        }
                                        title="Voir le profil"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateParticipantStatus(
                                            participant.id,
                                            "confirmed"
                                          )
                                        }
                                        title="Valider"
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs"
                                          >
                                            Gérer
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuLabel>
                                            {participant.userName || "Utilisateur"}
                                          </DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={handleSendMessage}
                                          >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Envoyer un message
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() =>
                                              handleRemoveParticipantClick(
                                                participant.userId,
                                                participant.userName
                                              )
                                            }
                                          >
                                            <X className="h-4 w-4 mr-2" />
                                            Retirer de la liste
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.status === "draft" && (
                    <Button
                      className="w-full"
                      onClick={() => handleUpdateStatus("published")}
                    >
                      Publier l&apos;événement
                    </Button>
                  )}
                  {event.status === "published" && !isPast && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpdateStatus("cancelled")}
                    >
                      Annuler l&apos;événement
                    </Button>
                  )}
                  {event.status === "published" && isPast && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpdateStatus("completed")}
                    >
                      Marquer comme terminé
                    </Button>
                  )}
                  {event.status === "cancelled" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpdateStatus("published")}
                    >
                      Republier l&apos;événement
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Participants</span>
                    <span className="font-semibold">
                      {event.participantCount}
                    </span>
                  </div>
                  {event.maxParticipants && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Capacité</span>
                        <span>
                          {Math.round(
                            (event.participantCount / event.maxParticipants) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            event.participantCount >= event.maxParticipants
                              ? "bg-orange-500"
                              : "bg-primary"
                          )}
                          style={{
                            width: `${Math.min(
                              (event.participantCount / event.maxParticipants) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {event.waitlistCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">En attente</span>
                      <span className="font-semibold">
                        {event.waitlistCount}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>
                      {format(new Date(event.createdAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modifié le</span>
                    <span>
                      {format(new Date(event.updatedAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono">#{event.id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Dialog de confirmation pour retirer un participant */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le participant</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer{" "}
              <strong>
                {participantToRemove?.userName || "ce participant"}
              </strong>{" "}
              de la liste ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false);
                setParticipantToRemove(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRemoveParticipant}>
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
