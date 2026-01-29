"use client";

import { useMemo, useState } from "react";
import { Clock, Users, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MISSION_TYPES } from "@/lib/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SlotParticipant {
  id: number;
  participantId: number | null;
  prefilledName: string | null;
  missionType: string | null;
  createdAt: string;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

interface Mission {
  type: string;
  description?: string | null;
  maxParticipants: number;
  participants: SlotParticipant[];
  registeredCount: number;
  prefilledCount: number;
  availableSpots: number;
}

interface SlotWithParticipants {
  id: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  missions: Mission[];
  participants: SlotParticipant[];
  registeredCount: number;
  prefilledCount: number;
  totalCount: number;
  availableSpots: number;
}

interface BusinessPlanningCalendarProps {
  slots: SlotWithParticipants[];
  eventStartDate: Date;
  eventEndDate: Date;
}

export function BusinessPlanningCalendar({
  slots,
  eventStartDate,
  eventEndDate,
}: BusinessPlanningCalendarProps) {
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());

  // Générer tous les jours de l'événement
  const eventDays = useMemo(() => {
    return eachDayOfInterval({
      start: eventStartDate,
      end: eventEndDate,
    });
  }, [eventStartDate, eventEndDate]);

  // Grouper les créneaux par jour
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, SlotWithParticipants[]> = {};

    eventDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = slots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return isSameDay(slotDate, day);
      });
    });

    return grouped;
  }, [slots, eventDays]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: fr });
  };

  const formatDayLabel = (date: Date) => {
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  const toggleSlot = (slotId: number) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slotId)) {
      newExpanded.delete(slotId);
    } else {
      newExpanded.add(slotId);
    }
    setExpandedSlots(newExpanded);
  };

  // Vérifier que nous avons des jours valides
  if (!eventDays || eventDays.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Impossible de générer le calendrier. Vérifiez que les dates de début
            et de fin sont correctes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucun créneau configuré pour cet événement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {eventDays.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const daySlots = slotsByDay[dayKey] || [];

        if (daySlots.length === 0) {
          return null;
        }

        return (
          <Card key={dayKey}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {formatDayLabel(day)}
                </CardTitle>
                <Badge variant="outline">
                  {daySlots.length} créneau{daySlots.length > 1 ? "x" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {daySlots.map((slot) => {
                const isExpanded = expandedSlots.has(slot.id);
                const hasMissions = slot.missions && slot.missions.length > 0;

                return (
                  <Collapsible
                    key={slot.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSlot(slot.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {slot.totalCount}/{slot.maxParticipants} personne
                                {slot.maxParticipants > 1 ? "s" : ""}
                              </span>
                            </div>
                            {hasMissions && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {slot.missions.length} mission
                                  {slot.missions.length > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                            {slot.availableSpots <= 0 ? (
                              <Badge variant="secondary" className="ml-auto">
                                Complet
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="ml-auto">
                                {slot.availableSpots} place
                                {slot.availableSpots > 1 ? "s" : ""} disponible
                                {slot.availableSpots > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4 border-t">
                          {hasMissions ? (
                            // Afficher les missions avec leurs participants
                            <div className="space-y-4 pt-4">
                              {slot.missions.map((mission, missionIdx) => (
                                <div
                                  key={missionIdx}
                                  className="border rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {MISSION_TYPES[mission.type as keyof typeof MISSION_TYPES] ||
                                          mission.type}
                                      </span>
                                    </div>
                                    <Badge variant="outline">
                                      {mission.registeredCount + mission.prefilledCount}/
                                      {mission.maxParticipants}
                                    </Badge>
                                  </div>
                                  {mission.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {mission.description}
                                    </p>
                                  )}
                                  {mission.participants.length > 0 ? (
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium">
                                        Participants ({mission.participants.length}) :
                                      </h5>
                                      <div className="space-y-2">
                                        {mission.participants.map((participant) => (
                                          <div
                                            key={participant.id}
                                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                                          >
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage
                                                src={participant.userImage || ""}
                                              />
                                              <AvatarFallback>
                                                {participant.userName
                                                  ?.charAt(0)
                                                  .toUpperCase() ||
                                                  participant.prefilledName
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                  "?"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">
                                                {participant.userName ||
                                                  participant.prefilledName ||
                                                  "Participant"}
                                              </p>
                                              {participant.userEmail && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                  {participant.userEmail}
                                                </p>
                                              )}
                                            </div>
                                            {participant.prefilledName && (
                                              <Badge variant="outline" className="text-xs">
                                                Pré-rempli
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Aucun participant pour cette mission
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Afficher les participants sans missions (ancien format)
                            <div className="pt-4 space-y-2">
                              <h5 className="text-sm font-medium">
                                Participants ({slot.participants.length}) :
                              </h5>
                              {slot.participants.length > 0 ? (
                                <div className="space-y-2">
                                  {slot.participants.map((participant) => (
                                    <div
                                      key={participant.id}
                                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={participant.userImage || ""}
                                        />
                                        <AvatarFallback>
                                          {participant.userName
                                            ?.charAt(0)
                                            .toUpperCase() ||
                                            participant.prefilledName
                                              ?.charAt(0)
                                              .toUpperCase() ||
                                            "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {participant.userName ||
                                            participant.prefilledName ||
                                            "Participant"}
                                        </p>
                                        {participant.userEmail && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {participant.userEmail}
                                          </p>
                                        )}
                                      </div>
                                      {participant.prefilledName && (
                                        <Badge variant="outline" className="text-xs">
                                          Pré-rempli
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Aucun participant inscrit
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
