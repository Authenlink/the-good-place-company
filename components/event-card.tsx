"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar, Users,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
  RefreshCw,
  User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_TYPES } from "@/lib/schema";
import { EventCommentSection } from "@/components/event-comment-section";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  event: {
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
    backgroundType?: "image" | "gradient" | null;
    backgroundImageIndex?: number | null;
    backgroundGradient?: {
      color1: string;
      color2: string;
      css: string;
    } | null;
    maxParticipants: number | null;
    recurrence?: string | null;
    recurrenceGroupId?: number | null;
    isPaid: boolean;
    price: string | null;
    currency: string;
    status: string;
    companyId: number | null;
    companyName: string | null;
    companyLogo: string | null;
    participantCount: number;
    waitlistCount: number;
  };
  participantStatus?: "confirmed" | "waitlisted" | null;
  onView?: (event: EventCardProps["event"]) => void;
  onEdit?: (event: EventCardProps["event"]) => void;
  onDelete?: (eventId: number) => void;
  showActions?: boolean;
}

export function EventCard({
  event,
  participantStatus,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: EventCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const { toast } = useToast();

  // Charger l'état initial des likes et le nombre de commentaires
  useEffect(() => {
    fetchLikes();
    fetchCommentCount();
  }, [event.id]);

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.count);
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des likes:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleLike = async () => {
    const previousIsLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (previousIsLiked) {
        // Supprimer le like
        const response = await fetch(`/api/events/${event.id}/likes`, {
          method: "DELETE",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
        }
      } else {
        // Ajouter le like
        const response = await fetch(`/api/events/${event.id}/likes`, {
          method: "POST",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du like:", error);
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
    }
  };

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        // Compter tous les commentaires (principaux + réponses)
        const totalCount = data.reduce((acc: number, comment: any) => {
          return acc + 1 + (comment.replies?.length || 0);
        }, 0);
        setCommentCount(totalCount);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du nombre de commentaires:", error);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/events/${event.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien de l'événement a été copié dans le presse-papier.",
      });
    } catch (error) {
      console.error("Erreur lors de la copie du lien:", error);
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const formatEventTime = () => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (endDate) {
      return `${format(startDate, "HH:mm", { locale: fr })} - ${format(
        endDate,
        "HH:mm",
        { locale: fr }
      )}`;
    }
    return format(startDate, "HH:mm", { locale: fr });
  };

  // Déterminer la couleur du badge selon le type d'événement
  const getEventTypeColor = (eventType: string) => {
    // Pour déboguer - assigner une couleur unique à chaque type pour voir si ça marche
    const debugColors: Record<string, string> = {
      maraude: "bg-red-100 text-red-800 border-red-200",
      distribution_alimentaire: "bg-blue-100 text-blue-800 border-blue-200",
      distribution_vetements: "bg-green-100 text-green-800 border-green-200",
      action_ecologique: "bg-yellow-100 text-yellow-800 border-yellow-200",
      collecte_dons: "bg-purple-100 text-purple-800 border-purple-200",
      collecte_fonds: "bg-pink-100 text-pink-800 border-pink-200",
      soiree_caritative: "bg-indigo-100 text-indigo-800 border-indigo-200",
      vente_solidaire: "bg-teal-100 text-teal-800 border-teal-200",
      concert_benefice: "bg-orange-100 text-orange-800 border-orange-200",
      repas_partage: "bg-cyan-100 text-cyan-800 border-cyan-200",
      atelier: "bg-lime-100 text-lime-800 border-lime-200",
      sensibilisation: "bg-amber-100 text-amber-800 border-amber-200",
      benevolat: "bg-emerald-100 text-emerald-800 border-emerald-200",
      autre: "bg-gray-100 text-gray-800 border-gray-200",
    };

    // Si eventType n'est pas trouvé, utiliser une couleur basée sur la longueur de la string
    // pour avoir au moins une variété
    if (!debugColors[eventType]) {
      const colors = Object.values(debugColors);
      const index = eventType.length % colors.length;
      return colors[index];
    }

    return debugColors[eventType];
  };

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
    // Fallback: première image si disponible
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
    <Card className="w-full mb-4 overflow-hidden h-full py-0 group hover:shadow-lg transition-shadow">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Background de l'événement - tout en haut sans padding */}
        {background && (
          <Link href={`/events/${event.id}`} className="block">
            <div className="relative h-32 cursor-pointer">
              {background.type === "image" ? (
                <Image
                  src={background.value}
                  alt={event.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: background.value,
                  }}
                />
              )}
              {/* Badge de statut avec système de couleur intelligent */}
              <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium px-1.5 py-0 ${
                    new Date(event.startDate) > new Date()
                      ? "bg-green-100 text-green-800 border-green-200"
                      : new Date(event.startDate).getTime() > new Date().getTime() - 24 * 60 * 60 * 1000
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  {new Date(event.startDate) > new Date() ? "À venir" : "Passé"}
                </Badge>
                {/* Badge récurrent */}
                {(event.recurrence && event.recurrence !== "none" && event.recurrenceGroupId !== null) && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium px-1.5 py-0 bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Récurrent
                  </Badge>
                )}
                {/* Badge de statut de participation */}
                {participantStatus && (
                  <Badge
                    variant="secondary"
                    className={`text-xs font-medium px-1.5 py-0 ${
                      participantStatus === "confirmed"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-orange-100 text-orange-800 border-orange-200"
                    }`}
                  >
                    {participantStatus === "confirmed" ? "Inscrit" : "Liste d'attente"}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Header avec avatar et nom - après l'image */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={event.companyLogo || undefined}
                alt={event.companyName || "Entreprise"}
              />
              <AvatarFallback className="text-xs">
                {(event.companyName || "E").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-semibold text-foreground">
              {event.companyName || "Entreprise"}
            </p>
          </div>
          {event.companyId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/associations/${event.companyName}`)}
                  className="cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Voir profil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Contenu de l'événement */}
        <div className="p-3 flex-1">
          {/* Titre */}
          <div className="mb-2">
            <Link href={`/events/${event.id}`}>
              <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2">
                {event.title}
              </h3>
            </Link>
          </div>

          {/* Ligne unique d'informations : Date/Heure → Badges → Participants */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {/* Date et Heure */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(event.startDate), "dd MMM", {
                  locale: fr,
                })}
              </span>
              <Clock className="h-3.5 w-3.5 ml-1" />
              <span>{formatEventTime()}</span>
            </div>

            {/* Séparateur visuel */}
            <span className="text-muted-foreground/30">|</span>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs font-medium px-1.5 py-0 ${getEventTypeColor(event.eventType)}`}
              >
                {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ||
                  event.eventType}
              </Badge>
              {event.isPaid && event.price && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {event.price} {event.currency}
                </Badge>
              )}
            </div>

            {/* Séparateur visuel */}
            <span className="text-muted-foreground/30">|</span>

            {/* Participants */}
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {event.participantCount}
                {event.maxParticipants && `/${event.maxParticipants}`}
                {event.waitlistCount > 0 && ` (+${event.waitlistCount})`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-t mt-auto">
          {showActions && (onView || onEdit || onDelete) ? (
            <div className="flex items-center space-x-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(event)}
                  className="text-xs"
                >
                  Voir
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="text-xs"
                >
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(event.id)}
                  className="text-xs"
                >
                  Supprimer
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={loadingLikes}
                    className={`p-0 h-7 w-7 ${
                      isLiked ? "text-red-500" : "text-muted-foreground"
                    } hover:text-red-500`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  {likeCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {likeCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowComments(!showComments);
                      if (!showComments) {
                        fetchCommentCount();
                      }
                    }}
                    className="p-0 h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {commentCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {commentCount}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-0 h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/events/${event.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Voir les détails
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Section commentaires */}
        {showComments && (
          <div className="px-3 pb-3 border-t bg-muted">
            <div className="py-2">
              <EventCommentSection eventId={event.id} onCommentAdded={fetchCommentCount} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
