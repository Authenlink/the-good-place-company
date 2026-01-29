"use client";

import { useState, useMemo } from "react";
import { Plus, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, isSameDay, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { EventSlotEditor } from "./event-slot-editor";
import { MissionType } from "@/lib/schema";

interface Mission {
  type: MissionType;
  description?: string;
  maxParticipants: number;
}

interface Slot {
  id?: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  missions: Mission[];
  // Champs dépréciés pour compatibilité
  missionType?: MissionType;
  missionDescription?: string;
}

interface EventPlanningCalendarProps {
  slots: Slot[];
  onSlotsChange: (slots: Slot[]) => void;
  eventStartDate: Date;
  eventEndDate: Date;
  slotDurationMinutes: number;
}

export function EventPlanningCalendar({
  slots,
  onSlotsChange,
  eventStartDate,
  eventEndDate,
  slotDurationMinutes,
}: EventPlanningCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  // Générer tous les jours de l'événement
  const eventDays = useMemo(() => {
    return eachDayOfInterval({
      start: eventStartDate,
      end: eventEndDate,
    });
  }, [eventStartDate, eventEndDate]);

  // Grouper les créneaux par jour
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, Slot[]> = {};
    
    eventDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = slots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return isSameDay(slotDate, day);
      });
    });

    return grouped;
  }, [slots, eventDays]);

  // Ajouter un créneau pour un jour spécifique
  const addSlotForDay = (day: Date, hour: number, minute: number = 0) => {
    const startTime = new Date(day);
    startTime.setHours(hour, minute, 0, 0);

    const endTime = addMinutes(startTime, slotDurationMinutes);

    // Vérifier que le créneau est dans les limites de l'événement
    if (startTime < eventStartDate || endTime > eventEndDate) {
      return;
    }

    const newSlot: Slot = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      maxParticipants: 10,
      missions: [{
        type: "autre",
        description: "",
        maxParticipants: 10,
      }],
    };

    onSlotsChange([...slots, newSlot]);
  };

  // Générer les heures de la journée (de 6h à 23h par défaut, ou adaptées à l'événement)
  const hours = useMemo(() => {
    const startHour = Math.max(6, Math.min(eventStartDate.getHours() - 1, 6));
    const endHour = Math.min(23, eventEndDate.getHours() + (eventEndDate.getMinutes() > 0 ? 1 : 0) + 1);
    const hourList: number[] = [];
    
    for (let h = startHour; h <= endHour && h <= 23; h++) {
      hourList.push(h);
    }
    
    // Si la liste est trop courte, ajouter des heures supplémentaires
    if (hourList.length < 12) {
      const minHour = Math.min(...hourList);
      const maxHour = Math.max(...hourList);
      for (let h = Math.max(6, minHour - 2); h < minHour; h++) {
        hourList.unshift(h);
      }
      for (let h = maxHour + 1; h <= Math.min(23, maxHour + 3); h++) {
        hourList.push(h);
      }
      hourList.sort((a, b) => a - b);
    }
    
    return hourList.filter(h => h >= 6 && h <= 23);
  }, [eventStartDate, eventEndDate]);

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const formatDayLabel = (date: Date) => {
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  // Vérifier que nous avons des jours valides
  if (!eventDays || eventDays.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Impossible de générer le calendrier. Vérifiez que les dates de début et de fin sont correctes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue calendrier */}
      <div className="space-y-4">
        {eventDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const daySlots = slotsByDay[dayKey] || [];
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <Card key={dayKey} className={isSelected ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatDayLabel(day)}
                  </CardTitle>
                  <Badge variant="outline">{daySlots.length} créneau{daySlots.length > 1 ? "x" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Grille horaire */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {hours.map((hour) => {
                    const slotStart = new Date(day);
                    slotStart.setHours(hour, 0, 0, 0);
                    const slotEnd = addMinutes(slotStart, slotDurationMinutes);

                    // Vérifier si cette heure est dans les limites de l'événement
                    const dayStart = new Date(day);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(day);
                    dayEnd.setHours(23, 59, 59, 999);

                    const eventDayStart = isSameDay(day, eventStartDate)
                      ? eventStartDate
                      : dayStart;
                    const eventDayEnd = isSameDay(day, eventEndDate)
                      ? eventEndDate
                      : dayEnd;

                    if (slotStart < eventDayStart || slotEnd > eventDayEnd) {
                      return null;
                    }

                    // Vérifier si un créneau existe déjà à cette heure (avec une tolérance de 5 minutes)
                    const existingSlot = daySlots.find((slot) => {
                      const slotStartTime = new Date(slot.startTime);
                      const timeDiff = Math.abs(
                        slotStartTime.getTime() - slotStart.getTime()
                      );
                      // Tolérance de 5 minutes
                      return timeDiff < 5 * 60 * 1000;
                    });

                    return (
                      <Button
                        key={`${dayKey}-${hour}`}
                        variant={existingSlot ? "outline" : "ghost"}
                        size="sm"
                        className="h-12 flex flex-col items-center justify-center gap-1 relative"
                        onClick={() => {
                          if (!existingSlot) {
                            addSlotForDay(day, hour, 0);
                          }
                        }}
                        disabled={!!existingSlot}
                      >
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                        {existingSlot && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                          >
                            ✓
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Liste des créneaux existants pour ce jour */}
                {daySlots.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <h4 className="text-sm font-semibold">Créneaux configurés :</h4>
                    {daySlots.map((slot, index) => {
                      const globalIndex = slots.findIndex(
                        (s) => s.startTime === slot.startTime
                      );
                      
                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <EventSlotEditor
                            slot={slot}
                            onUpdate={(updated) => {
                              const newSlots = [...slots];
                              newSlots[globalIndex] = updated;
                              onSlotsChange(newSlots);
                            }}
                            onDelete={() => {
                              const newSlots = slots.filter(
                                (_, i) => i !== globalIndex
                              );
                              onSlotsChange(newSlots);
                            }}
                            eventStartDate={eventStartDate}
                            eventEndDate={eventEndDate}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
