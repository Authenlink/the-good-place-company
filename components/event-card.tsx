"use client";

import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  Euro,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_TYPES, EventType, EventStatus } from "@/lib/schema";
import { cn } from "@/lib/utils";

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
  isPaid?: boolean | null;
  price?: string | null;
  currency?: string | null;
  fundraisingGoal?: string | null;
  status: EventStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  createdAt: string;
}

interface EventCardProps {
  event: Event;
  onView?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: number) => void;
  showActions?: boolean;
}

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

// Couleurs par statut
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

export function EventCard({
  event,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: EventCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date();
  const isFull = event.maxParticipants
    ? event.participantCount >= event.maxParticipants
    : false;

  // Calculer le pourcentage de remplissage
  const fillPercentage = event.maxParticipants
    ? Math.min((event.participantCount / event.maxParticipants) * 100, 100)
    : 0;

  return (
    <Card
      className={cn(
        "w-full overflow-hidden transition-all hover:shadow-md",
        isPast && "opacity-75"
      )}
    >
      {/* Image de couverture */}
      {event.images && event.images.length > 0 && (
        <div className="relative h-40 w-full">
          <Image
            src={event.images[0]}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge
              variant="outline"
              className={cn(
                "backdrop-blur-sm bg-background/80",
                eventTypeColors[event.eventType]
              )}
            >
              {EVENT_TYPES[event.eventType]}
            </Badge>
          </div>
          {event.status !== "published" && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="outline"
                className={cn(
                  "backdrop-blur-sm bg-background/80",
                  statusColors[event.status]
                )}
              >
                {statusLabels[event.status]}
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className={cn("pb-2", !event.images?.length && "pt-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges si pas d'image */}
            {(!event.images || event.images.length === 0) && (
              <div className="flex gap-2 mb-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={eventTypeColors[event.eventType]}
                >
                  {EVENT_TYPES[event.eventType]}
                </Badge>
                {event.status !== "published" && (
                  <Badge
                    variant="outline"
                    className={statusColors[event.status]}
                  >
                    {statusLabels[event.status]}
                  </Badge>
                )}
              </div>
            )}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {event.title}
            </h3>
          </div>

          {showActions && (onView || onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(event)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(event)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(event.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Description tronquée */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Infos date et lieu */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{format(startDate, "EEEE d MMMM yyyy", { locale: fr })}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(startDate, "HH:mm", { locale: fr })}
              {endDate && ` - ${format(endDate, "HH:mm", { locale: fr })}`}
            </span>
          </div>

          {(event.location || event.city) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {[event.location, event.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {/* Prix si événement payant */}
          {event.isPaid && event.price && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="font-medium text-green-600">
                {parseFloat(event.price).toFixed(2)} {event.currency || "EUR"}
              </span>
            </div>
          )}

          {/* Gratuit badge */}
          {!event.isPaid && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Gratuit</span>
            </div>
          )}
        </div>

        {/* Jauge de participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {event.participantCount} inscrit
                {event.participantCount > 1 ? "s" : ""}
              </span>
              {event.maxParticipants && (
                <span className="text-muted-foreground">
                  / {event.maxParticipants}
                </span>
              )}
            </div>
            {event.waitlistCount > 0 && (
              <span className="text-xs text-muted-foreground">
                +{event.waitlistCount} en attente
              </span>
            )}
          </div>

          {event.maxParticipants && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFull ? "bg-orange-500" : "bg-primary"
                )}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          )}

          {isFull && (
            <p className="text-xs text-orange-600 font-medium">
              Complet - Liste d'attente disponible
            </p>
          )}
        </div>

        {/* Organisation */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={event.companyLogo || ""}
              alt={event.companyName || ""}
            />
            <AvatarFallback className="text-xs">
              {event.companyName?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {event.companyName || "Association"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
