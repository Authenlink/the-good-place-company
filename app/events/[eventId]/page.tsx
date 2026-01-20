"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Users,
  Clock, RefreshCw,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { EventCommentSection } from "@/components/event-comment-section";

// Couleurs par type d'événement
const eventTypeColors: Record<EventType, string> = {
  maraude: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  distribution_alimentaire: "bg-green-500/10 text-green-600 border-green-500/20",
  distribution_vetements: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  action_ecologique: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  benevolat: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  collecte_dons: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  collecte_fonds: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  soiree_caritative: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  vente_solidaire: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  concert_benefice: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  repas_partage: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  atelier: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  sensibilisation: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  autre: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

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
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const hasScrolled = useScroll();

  const fetchEvent = useCallback(async () => {
    setLoading(true);
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
        router.push("/events");
      } else if (response.status === 401) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour voir les détails de l'événement.",
          variant: "destructive",
        });
        router.push("/login");
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
    }
  }, [resolvedParams.eventId, router, toast]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchEvent();
  }, [sessionStatus, fetchEvent]);

  const fetchLikes = useCallback(async () => {
    if (sessionStatus !== "authenticated") {
      setLoadingLikes(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.count || 0);
        setIsLiked(data.isLiked || false);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des likes:", error);
    } finally {
      setLoadingLikes(false);
    }
  }, [resolvedParams.eventId, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchLikes();
  }, [sessionStatus, fetchLikes]);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    const previousIsLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (previousIsLiked) {
        // Supprimer le like
        const response = await fetch(`/api/events/${resolvedParams.eventId}/likes`, {
          method: "DELETE",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
          const error = await response.json();
          toast({
            title: "Erreur",
            description: error.error || "Impossible de retirer le like",
            variant: "destructive",
          });
        }
      } else {
        // Ajouter le like
        const response = await fetch(`/api/events/${resolvedParams.eventId}/likes`, {
          method: "POST",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
          const error = await response.json();
          toast({
            title: "Erreur",
            description: error.error || "Impossible d'ajouter le like",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du like:", error);
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(
        `/api/events/${resolvedParams.eventId}/participants`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.message || "Inscription réussie",
          description:
            data.message === "Vous avez été ajouté à la liste d'attente"
              ? "Vous serez notifié si une place se libère."
              : "Vous êtes maintenant inscrit à cet événement.",
        });
        fetchEvent();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur d'inscription",
          description: errorData.error || "Impossible de s'inscrire à l'événement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast({
        title: "Erreur",
        description: "Impossible de s'inscrire à l'événement.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!session) {
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(
        `/api/events/${resolvedParams.eventId}/participants`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Désinscription réussie",
          description: "Vous avez été désinscrit de cet événement.",
        });
        fetchEvent();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur de désinscription",
          description: errorData.error || "Impossible de se désinscrire.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la désinscription:", error);
      toast({
        title: "Erreur",
        description: "Impossible de se désinscrire.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
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
  const isFull =
    event.maxParticipants !== null &&
    event.participantCount >= event.maxParticipants;
  const canRegister =
    event.status === "published" && !isPast && sessionStatus === "authenticated";

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
  const bannerStyle =
    background?.type === "gradient"
      ? { background: background.value }
      : background?.type === "image"
      ? {}
      : { background: "linear-gradient(to bottom, #f3f4f6, #ffffff)" };

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={cn(
            "sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            hasScrolled && "border-b"
          )}
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
                  <BreadcrumbLink href="/events">Événements</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{event.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          {/* Bannière pleine largeur */}
          <div className="relative h-48 w-full" style={bannerStyle}>
            {background?.type === "image" && (
              <Image
                src={background.value}
                alt={event.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header avec avatar qui chevauche */}
            <div className="flex flex-col md:flex-row gap-4 -mt-16">
              {event.companyName && (
                <Avatar className="h-32 w-32 border-4 border-background flex-shrink-0">
                  <AvatarImage src={event.companyLogo || ""} />
                  <AvatarFallback className="text-lg">
                    {event.companyName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 pt-20 md:pt-24">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <Badge
                        variant="outline"
                        className={eventTypeColors[event.eventType]}
                      >
                        {EVENT_TYPES[event.eventType]}
                      </Badge>
                      {isPast && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600">
                          Passé
                        </Badge>
                      )}
                      {isFull && !isPast && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                          Complet
                        </Badge>
                      )}
                      {event.recurrence && event.recurrence !== "none" && (
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-600 flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {
                            RECURRENCE_TYPES[
                              event.recurrence as keyof typeof RECURRENCE_TYPES
                            ]
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {event.companyName && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Organisé par
                    </p>
                    <Link
                      href={`/associations/${event.companyName}`}
                      className="text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {event.companyName}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Grid avec contenu principal et sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Card avec les détails */}
                <Card>
                  <CardContent className="space-y-6 pt-6">
                    {/* Date et heure */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-muted-foreground">
                            {format(startDate, "EEEE d MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Heure</p>
                          <p className="text-muted-foreground">
                            {format(startDate, "HH:mm", { locale: fr })}
                            {endDate &&
                              ` - ${format(endDate, "HH:mm", { locale: fr })}`}
                          </p>
                        </div>
                      </div>
                      </div>
                      <div className="space-y-3">
                        {(event.location || event.city) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Lieu</p>
                            {event.location && (
                              <p className="text-muted-foreground">{event.location}</p>
                            )}
                            {event.address && (
                              <p className="text-sm text-muted-foreground">
                                {event.address}
                              </p>
                            )}
                            {event.city && (
                              <p className="text-sm text-muted-foreground">
                                {event.city}
                              </p>
                            )}
                          </div>
                        </div>
                        )}
                        <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Participants</p>
                          <p className="text-muted-foreground">
                            {event.participantCount} inscrit
                            {event.participantCount > 1 ? "s" : ""}
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                            {event.waitlistCount > 0 &&
                              ` • ${event.waitlistCount} en liste d'attente`}
                          </p>
                        </div>
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

                    {/* Informations supplémentaires */}
                    {(event.requirements ||
                      event.targetAudience ||
                      event.isPaid ||
                      event.contactEmail ||
                      event.contactPhone ||
                      event.externalLink) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          {event.requirements && (
                            <div>
                              <h3 className="font-semibold mb-2">Prérequis / À apporter</h3>
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                {event.requirements}
                              </p>
                            </div>
                          )}
                          {event.targetAudience && (
                            <div>
                              <h3 className="font-semibold mb-2">Public cible</h3>
                              <p className="text-muted-foreground">{event.targetAudience}</p>
                            </div>
                          )}
                          {event.isPaid && event.price && (
                            <div>
                              <h3 className="font-semibold mb-2">Tarif</h3>
                              <p className="text-muted-foreground">
                                {event.price} {event.currency}
                              </p>
                            </div>
                          )}
                          {(event.contactEmail || event.contactPhone || event.externalLink) && (
                            <div>
                              <h3 className="font-semibold mb-2">Contact</h3>
                              <div className="space-y-2">
                                {event.contactEmail && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <a
                                      href={`mailto:${event.contactEmail}`}
                                      className="hover:text-primary hover:underline"
                                    >
                                      {event.contactEmail}
                                    </a>
                                  </div>
                                )}
                                {event.contactPhone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <a
                                      href={`tel:${event.contactPhone}`}
                                      className="hover:text-primary hover:underline"
                                    >
                                      {event.contactPhone}
                                    </a>
                                  </div>
                                )}
                                {event.externalLink && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <ExternalLink className="h-4 w-4" />
                                    <a
                                      href={event.externalLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary hover:underline"
                                    >
                                      Lien externe
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Section Commentaires */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commentaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EventCommentSection eventId={event.id} />
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Actions d'inscription */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!session ? (
                      <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Connectez-vous pour vous inscrire à cet événement.
                      </p>
                      <Button className="w-full" onClick={() => router.push("/login")}>
                        Se connecter
                      </Button>
                      </div>
                    ) : event.currentUserStatus === "confirmed" ? (
                      <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-medium">Vous êtes inscrit</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleUnregister}
                        disabled={registering || isPast}
                      >
                        {registering ? "Traitement..." : "Se désinscrire"}
                      </Button>
                      {isPast && (
                        <p className="text-xs text-muted-foreground">
                          Cet événement est passé, vous ne pouvez plus vous désinscrire.
                        </p>
                      )}
                      </div>
                    ) : event.currentUserStatus === "waitlisted" ? (
                      <div className="space-y-3">
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">Vous êtes en liste d&apos;attente</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vous serez notifié si une place se libère.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleUnregister}
                        disabled={registering}
                      >
                        {registering ? "Traitement..." : "Se désinscrire"}
                      </Button>
                      </div>
                    ) : canRegister ? (
                      <div className="space-y-3">
                      {isFull ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            L&apos;événement est complet. Vous pouvez vous inscrire sur la liste
                            d&apos;attente.
                          </p>
                          <Button
                            className="w-full"
                            onClick={handleRegister}
                            disabled={registering}
                          >
                            {registering
                              ? "Traitement..."
                              : "S'inscrire sur la liste d'attente"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={handleRegister}
                          disabled={registering}
                        >
                          {registering ? "Traitement..." : "S'inscrire"}
                        </Button>
                      )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                      {isPast ? (
                        <p className="text-sm text-muted-foreground">
                          Cet événement est déjà passé.
                        </p>
                      ) : event.status !== "published" ? (
                        <p className="text-sm text-muted-foreground">
                          Cet événement n&apos;est pas encore publié.
                        </p>
                      ) : null}
                      </div>
                    )}

                  {/* Barre de progression si capacité limitée */}
                  {event.maxParticipants && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacité</span>
                        <span>
                          {Math.round(
                            (event.participantCount / event.maxParticipants) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isFull ? "bg-orange-500" : "bg-primary"
                          )}
                          style={{
                            width: `${Math.min(
                              (event.participantCount / event.maxParticipants) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  </CardContent>
                </Card>

                {/* Section Likes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Likes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!session ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Connectez-vous pour aimer cet événement.
                      </p>
                      <Button className="w-full" onClick={() => router.push("/login")}>
                        Se connecter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant={isLiked ? "default" : "outline"}
                        className="w-full"
                        onClick={handleLike}
                        disabled={loadingLikes}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 mr-2",
                            isLiked && "fill-current"
                          )}
                        />
                        {loadingLikes
                          ? "Chargement..."
                          : isLiked
                          ? "J'aime déjà"
                          : "J'aime"}
                      </Button>
                      {likeCount > 0 && (
                        <p className="text-sm text-center text-muted-foreground">
                          {likeCount} {likeCount === 1 ? "personne aime" : "personnes aiment"} cet événement
                        </p>
                      )}
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
                      {format(new Date(event.createdAt), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modifié le</span>
                    <span>
                      {format(new Date(event.updatedAt), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
