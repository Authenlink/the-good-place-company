"use client";

import { useState } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPES } from "@/lib/schema";

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
    maxParticipants: number | null;
    isPaid: boolean;
    price: string | null;
    currency: string;
    status: string;
    companyName: string | null;
    companyLogo: string | null;
    participantCount: number;
    waitlistCount: number;
  };
  onView?: (event: any) => void;
  onEdit?: (event: any) => void;
  onDelete?: (eventId: number) => void;
  showActions?: boolean;
}

export function EventCard({
  event,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: EventCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const formatEventDate = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);

    if (startDate < now) {
      return `Passé - ${format(startDate, "dd/MM/yyyy", { locale: fr })}`;
    }

    const distance = formatDistanceToNow(startDate, { locale: fr });
    return `Dans ${distance}`;
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

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Header avec avatar et nom */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 sm:h-8 sm:w-8">
              <AvatarImage
                src={event.companyLogo || undefined}
                alt={event.companyName || "Entreprise"}
              />
              <AvatarFallback>
                {(event.companyName || "E").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm sm:text-sm font-semibold text-foreground">
                {event.companyName || "Entreprise"}
              </p>
              <p className="text-xs sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.startDate), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Image principale de l'événement */}
        {event.images && event.images.length > 0 && (
          <div className="relative aspect-[3/2] sm:aspect-[4/3]">
            <Image
              src={event.images[0]}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {/* Badge de statut */}
            <div className="absolute top-3 left-3">
              <Badge
                variant={
                  new Date(event.startDate) > new Date()
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {new Date(event.startDate) > new Date() ? "À venir" : "Passé"}
              </Badge>
            </div>
          </div>
        )}

        {/* Contenu de l'événement */}
        <div className="p-4 sm:p-5">
          {/* Titre et type */}
          <div className="mb-2 sm:mb-2">
            <h3 className="text-lg sm:text-lg font-semibold text-foreground mb-1 sm:mb-1">
              {event.title}
            </h3>
            <Badge variant="outline" className="text-xs">
              {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ||
                event.eventType}
            </Badge>
          </div>

          {/* Informations organisées en deux colonnes */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Colonne gauche */}
            <div className="space-y-2">
              {/* Date */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(event.startDate), "EEEE dd MMMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>

              {/* Heure */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatEventTime()}</span>
              </div>

              {/* Lieu */}
              {(event.location || event.city) && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.location && event.city
                      ? `${event.location}, ${event.city}`
                      : event.location || event.city}
                  </span>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div className="space-y-2">
              {/* Participants */}
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {event.participantCount}
                  {event.maxParticipants && `/${event.maxParticipants}`}
                  {event.waitlistCount > 0 &&
                    ` (+${event.waitlistCount} en liste d'attente)`}
                </span>
              </div>

              {/* Prix si payant */}
              {event.isPaid && event.price && (
                <Badge variant="secondary" className="text-xs">
                  {event.price} {event.currency}
                </Badge>
              )}

              {/* Dans X jours */}
              <div className="text-xs text-muted-foreground">
                ({formatEventDate()})
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`p-0 h-8 w-8 ${
                  isLiked ? "text-red-500" : "text-muted-foreground"
                } hover:text-red-500`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="p-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {likeCount > 0 && `${likeCount} like${likeCount > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Section commentaires (placeholder) */}
        {showComments && (
          <div className="px-4 pb-4 border-t bg-muted">
            <div className="py-3">
              <p className="text-xs text-muted-foreground text-center">
                Commentaires en cours de développement...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
