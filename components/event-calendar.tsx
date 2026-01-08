"use client";

import * as React from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_TYPES, EventType } from "@/lib/schema";

// Types
export interface CalendarEvent {
  id: number;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  city?: string | null;
  participantCount?: number;
  maxParticipants?: number | null;
  status: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateClick?: () => void;
  className?: string;
  title?: string;
  description?: string;
}

// Couleurs par type d'événement
const eventTypeColors: Record<
  EventType,
  { bg: string; text: string; border: string }
> = {
  maraude: {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-l-orange-500",
  },
  distribution_alimentaire: {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-l-green-500",
  },
  distribution_vetements: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-l-blue-500",
  },
  action_ecologique: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-l-emerald-500",
  },
  benevolat: {
    bg: "bg-teal-100 dark:bg-teal-950",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-l-teal-500",
  },
  collecte_dons: {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-l-purple-500",
  },
  collecte_fonds: {
    bg: "bg-pink-100 dark:bg-pink-950",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-l-pink-500",
  },
  soiree_caritative: {
    bg: "bg-rose-100 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-l-rose-500",
  },
  vente_solidaire: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-950",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-l-fuchsia-500",
  },
  concert_benefice: {
    bg: "bg-violet-100 dark:bg-violet-950",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-l-violet-500",
  },
  repas_partage: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-l-amber-500",
  },
  atelier: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-l-yellow-500",
  },
  sensibilisation: {
    bg: "bg-cyan-100 dark:bg-cyan-950",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-l-cyan-500",
  },
  autre: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-l-gray-500",
  },
};

const eventTypeBadgeColors: Record<EventType, string> = {
  maraude: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  distribution_alimentaire:
    "bg-green-500/10 text-green-600 border-green-500/20",
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

// Helper pour obtenir les événements d'un jour
function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.startDate);
    return isSameDay(eventDate, date);
  });
}

// Composant Skeleton
export function EventCalendarSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40 sm:w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 sm:h-9 sm:w-24" />
            <Skeleton className="h-8 w-8 sm:h-9 sm:w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-24 sm:w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-5 sm:h-6 w-full" />
          ))}
        </div>
        {/* Days grid */}
        {[...Array(5)].map((_, week) => (
          <div key={week} className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {[...Array(7)].map((_, day) => (
              <Skeleton
                key={day}
                className="h-[60px] sm:h-24 w-full rounded-md sm:rounded-lg"
              />
            ))}
          </div>
        ))}
        {/* Events list skeleton */}
        <div className="border-t pt-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 sm:h-16 w-full" />
          <Skeleton className="h-14 sm:h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal
export function EventCalendar({
  events,
  loading = false,
  onDateSelect,
  onEventClick,
  onCreateClick,
  className,
  title = "Calendrier",
  description = "Vos événements à venir",
}: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startOfMonth(new Date())
  );

  // Événements du jour sélectionné
  const selectedDayEvents = React.useMemo(
    () => getEventsForDay(events, selectedDate),
    [events, selectedDate]
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  if (loading) {
    return <EventCalendarSkeleton className={className} />;
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="pb-3 space-y-3">
        {/* Titre et description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{title}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {description}
            </CardDescription>
          </div>
          {/* Boutons d'action */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={goToToday}
              className="text-xs sm:text-sm"
            >
              <CalendarIcon className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Aujourd&apos;hui</span>
            </Button>
            {onCreateClick && (
              <Button
                variant="default"
                size="sm"
                onClick={onCreateClick}
                className="text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Créer</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Navigation du mois */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Grille du calendrier */}
        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={events}
          onDateSelect={handleDateSelect}
          onEventClick={onEventClick}
        />

        {/* Liste des événements du jour sélectionné */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </h4>
            {selectedDayEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedDayEvents.length} événement
                {selectedDayEvents.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun événement ce jour
              </p>
              {onCreateClick && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={onCreateClick}
                >
                  Créer un événement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <EventDetailItem
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick?.(event)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Grille du calendrier avec mini-cartes
function CalendarGrid({
  currentMonth,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
}: {
  currentMonth: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: fr });
  const endDate = endOfWeek(monthEnd, { locale: fr });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Jours de la semaine (court pour mobile, complet pour desktop)
  const weekDaysFull = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekDaysShort = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="space-y-1">
      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekDaysFull.map((dayName, idx) => (
          <div
            key={dayName}
            className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2"
          >
            <span className="hidden sm:inline">{dayName}</span>
            <span className="sm:hidden">{weekDaysShort[idx]}</span>
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((date, idx) => {
          const dayEvents = getEventsForDay(events, date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <DayCell
              key={idx}
              date={date}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              isToday={isToday}
              onSelect={() => onDateSelect(date)}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// Cellule d'un jour avec mini-cartes d'événements
function DayCell({
  date,
  events,
  isCurrentMonth,
  isSelected,
  isToday,
  onSelect,
  onEventClick,
}: {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  // Sur mobile, montrer seulement 1 événement, sur desktop 2
  const maxEventsToShowMobile = 1;
  const maxEventsToShowDesktop = 2;

  return (
    <div
      className={cn(
        "min-h-[60px] sm:min-h-[90px] p-0.5 sm:p-1 rounded-md sm:rounded-lg border cursor-pointer transition-all",
        "hover:bg-muted/50",
        isCurrentMonth ? "bg-background" : "bg-muted/30",
        isSelected && "ring-2 ring-primary ring-offset-1",
        isToday && !isSelected && "border-primary"
      )}
      onClick={onSelect}
    >
      {/* Numéro du jour */}
      <div
        className={cn(
          "text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full",
          !isCurrentMonth && "text-muted-foreground",
          isToday && "bg-primary text-primary-foreground"
        )}
      >
        {format(date, "d")}
      </div>

      {/* Mini-cartes d'événements - Version mobile */}
      <div className="space-y-0.5 sm:hidden">
        {events.slice(0, maxEventsToShowMobile).map((event) => (
          <MiniEventCard
            key={event.id}
            event={event}
            compact
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
          />
        ))}
        {events.length > maxEventsToShowMobile && (
          <div className="text-[8px] text-muted-foreground px-0.5 font-medium">
            +{events.length - maxEventsToShowMobile}
          </div>
        )}
      </div>

      {/* Mini-cartes d'événements - Version desktop */}
      <div className="space-y-0.5 hidden sm:block">
        {events.slice(0, maxEventsToShowDesktop).map((event) => (
          <MiniEventCard
            key={event.id}
            event={event}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
          />
        ))}
        {events.length > maxEventsToShowDesktop && (
          <div className="text-[10px] text-muted-foreground px-1 font-medium">
            +{events.length - maxEventsToShowDesktop} autre
            {events.length - maxEventsToShowDesktop > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini carte d'événement pour le calendrier
function MiniEventCard({
  event,
  onClick,
  compact = false,
}: {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  const colors = eventTypeColors[event.eventType];
  const startTime = format(new Date(event.startDate), "HH:mm");

  // Version compacte pour mobile (juste une barre colorée)
  if (compact) {
    return (
      <div
        className={cn(
          "h-1.5 rounded-full cursor-pointer transition-all hover:opacity-80",
          colors.bg.replace("bg-", "bg-").split(" ")[0].replace("-100", "-400"),
          "bg-opacity-70"
        )}
        onClick={onClick}
        title={`${startTime} - ${event.title}`}
        style={{
          backgroundColor: getColorFromType(event.eventType),
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer",
        "border-l-2 transition-all hover:opacity-80",
        colors.bg,
        colors.text,
        colors.border
      )}
      onClick={onClick}
      title={`${startTime} - ${event.title}`}
    >
      <span className="font-medium">{startTime}</span>{" "}
      <span className="truncate">{event.title}</span>
    </div>
  );
}

// Helper pour obtenir la couleur hex d'un type d'événement
function getColorFromType(eventType: EventType): string {
  const colorMap: Record<EventType, string> = {
    maraude: "#f97316",
    distribution_alimentaire: "#22c55e",
    distribution_vetements: "#3b82f6",
    action_ecologique: "#10b981",
    benevolat: "#14b8a6",
    collecte_dons: "#a855f7",
    collecte_fonds: "#ec4899",
    soiree_caritative: "#f43f5e",
    vente_solidaire: "#d946ef",
    concert_benefice: "#8b5cf6",
    repas_partage: "#f59e0b",
    atelier: "#eab308",
    sensibilisation: "#06b6d4",
    autre: "#6b7280",
  };
  return colorMap[eventType];
}

// Détail d'un événement dans la liste sous le calendrier
function EventDetailItem({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: () => void;
}) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const colors = eventTypeColors[event.eventType];

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 pl-4 cursor-pointer transition-colors hover:bg-muted/50",
        "border-l-4",
        colors.border
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="font-medium text-sm line-clamp-1">{event.title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(startDate, "HH:mm", { locale: fr })}
              {endDate && ` - ${format(endDate, "HH:mm", { locale: fr })}`}
            </span>
            {(event.location || event.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[120px]">
                  {event.location || event.city}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", eventTypeBadgeColors[event.eventType])}
            >
              {EVENT_TYPES[event.eventType]}
            </Badge>
            {event.participantCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {event.participantCount}
                {event.maxParticipants && `/${event.maxParticipants}`}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
