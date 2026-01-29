"use client";

import { useState, useEffect } from "react";
import { Clock, Users, Briefcase, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MISSION_TYPES } from "@/lib/schema";

interface Mission {
  type: string;
  description?: string | null;
  maxParticipants: number;
  registeredCount?: number;
  availableSpots?: number;
}

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  missions?: Mission[];
  // Champs dépréciés pour compatibilité
  missionType?: string;
  missionDescription?: string | null;
  registeredCount: number;
  prefilledCount: number;
  totalCount: number;
  availableSpots: number;
}

interface EventSlotSelectorProps {
  slots: Slot[];
  onSelect: (slotId: number, missionType?: string) => void;
  selectedSlotId?: number | null;
  selectedMissionType?: string | null;
  isSubmitting?: boolean;
}

export function EventSlotSelector({
  slots,
  onSelect,
  selectedSlotId,
  selectedMissionType,
  isSubmitting = false,
}: EventSlotSelectorProps) {
  const [localSelectedSlotId, setLocalSelectedSlotId] = useState<number | null>(selectedSlotId || null);
  const [localSelectedMissionType, setLocalSelectedMissionType] = useState<string | null>(selectedMissionType || null);

  // Synchroniser avec les props externes uniquement si elles changent
  useEffect(() => {
    if (selectedSlotId !== localSelectedSlotId) {
      setLocalSelectedSlotId(selectedSlotId || null);
    }
  }, [selectedSlotId, localSelectedSlotId]);

  useEffect(() => {
    if (selectedMissionType !== localSelectedMissionType) {
      setLocalSelectedMissionType(selectedMissionType || null);
    }
  }, [selectedMissionType, localSelectedMissionType]);

  const handleSlotSelect = (slotId: number) => {
    setLocalSelectedSlotId(slotId);
    setLocalSelectedMissionType(null); // Réinitialiser la mission lors du changement de créneau
    
    // Toujours notifier le parent qu'un créneau a été sélectionné
    // Si le créneau n'a pas de missions, onSelect sera appelé avec seulement slotId
    // Si le créneau a des missions, onSelect sera appelé avec slotId seulement (mission sera ajoutée plus tard)
    const slot = slots.find(s => s.id === slotId);
    if (slot && (!slot.missions || slot.missions.length === 0)) {
      // Créneau sans missions : sélection complète
      onSelect(slotId);
    } else {
      // Créneau avec missions : notifier la sélection du créneau (mission sera sélectionnée après)
      onSelect(slotId);
    }
  };

  const handleMissionSelect = (slotId: number, missionType: string) => {
    setLocalSelectedMissionType(missionType);
    onSelect(slotId, missionType);
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucun créneau disponible pour cet événement.
        </CardContent>
      </Card>
    );
  }

  const selectedSlot = localSelectedSlotId ? slots.find(s => s.id === localSelectedSlotId) : null;
  const hasMissions = selectedSlot && selectedSlot.missions && selectedSlot.missions.length > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {!localSelectedSlotId ? (
        <>
          <div className="px-1">
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Sélectionnez un créneau</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choisissez le créneau horaire auquel vous souhaitez participer
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {slots.map((slot) => {
              const isFull = slot.availableSpots <= 0;

              return (
                <Card
                  key={slot.id}
                  className={`cursor-pointer transition-all ${
                    isFull
                      ? "opacity-60"
                      : "hover:border-primary/50 active:scale-[0.98]"
                  }`}
                  onClick={() => !isFull && !isSubmitting && handleSlotSelect(slot.id)}
                >
                  <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(slot.startTime)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                    {/* Afficher les missions */}
                    {slot.missions && slot.missions.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{slot.missions.length} mission{slot.missions.length > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {slot.missionType
                            ? MISSION_TYPES[slot.missionType as keyof typeof MISSION_TYPES] ||
                              slot.missionType
                            : "Mission"}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {slot.totalCount}/{slot.maxParticipants} personnes
                        </span>
                      </div>
                      {isFull ? (
                        <Badge variant="secondary" className="text-xs">Complet</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {slot.availableSpots} place{slot.availableSpots > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : hasMissions ? (
        <>
          {/* Afficher le créneau sélectionné et les missions */}
          <div className="px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalSelectedSlotId(null);
                setLocalSelectedMissionType(null);
              }}
              className="mb-3 sm:mb-4 text-xs sm:text-sm w-full sm:w-auto justify-start sm:justify-center"
            >
              ← Retour à la sélection des créneaux
            </Button>
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Sélectionnez une mission</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 break-words">
              Créneau sélectionné : {formatTime(selectedSlot!.startTime)} - {formatTime(selectedSlot!.endTime)} ({formatDate(selectedSlot!.startTime)})
            </p>
            <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
              Choisissez la mission que vous souhaitez effectuer pendant ce créneau. Les missions complètes ne peuvent pas être sélectionnées.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {selectedSlot!.missions!.map((mission, idx) => {
              const missionAvailableSpots = mission.availableSpots ?? (mission.maxParticipants - (mission.registeredCount ?? 0));
              const isMissionFull = missionAvailableSpots <= 0;
              const isSelected = localSelectedMissionType === mission.type;

              return (
                <Card
                  key={idx}
                  className={`transition-all ${
                    isMissionFull || isSubmitting
                      ? "opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "ring-2 ring-primary cursor-pointer"
                      : "cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                  }`}
                  onClick={() => {
                    if (!isMissionFull && !isSubmitting) {
                      handleMissionSelect(selectedSlot!.id, mission.type);
                    }
                  }}
                >
                  <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-1 min-w-0">
                        <Briefcase className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${isMissionFull ? "text-muted-foreground" : ""}`} />
                        <span className="truncate">{MISSION_TYPES[mission.type as keyof typeof MISSION_TYPES] || mission.type}</span>
                      </CardTitle>
                      {isSelected && (
                        <Badge variant="default" className="ml-2 flex-shrink-0 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Sélectionnée
                        </Badge>
                      )}
                      {isMissionFull && !isSelected && (
                        <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                          Complet
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                    {mission.type === "autre" && mission.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        {mission.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Users className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${isMissionFull ? "text-muted-foreground" : "text-muted-foreground"}`} />
                        <span className={isMissionFull ? "text-muted-foreground" : ""}>
                          {mission.registeredCount ?? 0}/{mission.maxParticipants} personne{mission.maxParticipants > 1 ? "s" : ""}
                        </span>
                      </div>
                      {isMissionFull ? (
                        <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 text-xs w-full sm:w-auto text-center">
                          Aucune place disponible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs w-full sm:w-auto text-center">
                          {missionAvailableSpots} place{missionAvailableSpots > 1 ? "s" : ""} disponible{missionAvailableSpots > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Créneau sélectionné sans missions (ancien format) */}
          <div className="px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalSelectedSlotId(null);
                setLocalSelectedMissionType(null);
              }}
              className="mb-3 sm:mb-4 text-xs sm:text-sm w-full sm:w-auto justify-start sm:justify-center"
            >
              ← Retour à la sélection des créneaux
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg bg-muted/50">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base">Créneau sélectionné</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {formatTime(selectedSlot!.startTime)} - {formatTime(selectedSlot!.endTime)} ({formatDate(selectedSlot!.startTime)})
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
