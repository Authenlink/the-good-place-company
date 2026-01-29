"use client";

import { useState } from "react";
import { X, Clock, Users, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MISSION_TYPES, MissionType } from "@/lib/schema";

interface Mission {
  type: MissionType;
  description?: string;
  maxParticipants: number;
}

interface EventSlot {
  id?: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  maxParticipants: number;
  missions: Mission[]; // Tableau de missions
  // Champs dépréciés pour compatibilité
  missionType?: MissionType;
  missionDescription?: string;
}

interface EventSlotEditorProps {
  slot: EventSlot;
  onUpdate: (slot: EventSlot) => void;
  onDelete: () => void;
  eventStartDate: Date;
  eventEndDate: Date;
}

export function EventSlotEditor({
  slot,
  onUpdate,
  onDelete,
  eventStartDate,
  eventEndDate,
}: EventSlotEditorProps) {
  // Normaliser le slot : convertir l'ancien format (missionType) au nouveau format (missions)
  const normalizedSlot: EventSlot = {
    ...slot,
    missions: slot.missions || (slot.missionType
      ? [{
          type: slot.missionType,
          description: slot.missionDescription,
          maxParticipants: slot.maxParticipants || 10,
        }]
      : [{
          type: "autre",
          description: "",
          maxParticipants: 10,
        }]),
  };

  const [localSlot, setLocalSlot] = useState<EventSlot>(normalizedSlot);

  const handleChange = (field: keyof EventSlot, value: any) => {
    const updated = { ...localSlot, [field]: value };
    setLocalSlot(updated);
    onUpdate(updated);
  };

  const addMission = () => {
    const newMission: Mission = {
      type: "autre",
      description: "",
      maxParticipants: 1,
    };
    handleChange("missions", [...localSlot.missions, newMission]);
  };

  const updateMission = (index: number, updatedMission: Mission) => {
    const newMissions = [...localSlot.missions];
    newMissions[index] = updatedMission;
    handleChange("missions", newMissions);
  };

  const removeMission = (index: number) => {
    const newMissions = localSlot.missions.filter((_, i) => i !== index);
    handleChange("missions", newMissions);
  };

  // Calculer le total max de participants basé sur les missions
  const totalMaxFromMissions = localSlot.missions.reduce(
    (sum, mission) => sum + mission.maxParticipants,
    0
  );

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const startDate = new Date(localSlot.startTime);
  const endDate = new Date(localSlot.endTime);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Créneau
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`start-date-${slot.id || "new"}`}>
              Date de début
            </Label>
            <Input
              id={`start-date-${slot.id || "new"}`}
              type="date"
              value={formatDate(startDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(startDate.getHours());
                newDate.setMinutes(startDate.getMinutes());
                handleChange("startTime", newDate.toISOString());
              }}
              min={formatDate(eventStartDate)}
              max={formatDate(eventEndDate)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`start-time-${slot.id || "new"}`}>
              Heure de début
            </Label>
            <Input
              id={`start-time-${slot.id || "new"}`}
              type="time"
              value={formatTime(startDate)}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":");
                const newDate = new Date(startDate);
                newDate.setHours(parseInt(hours));
                newDate.setMinutes(parseInt(minutes));
                handleChange("startTime", newDate.toISOString());
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`end-date-${slot.id || "new"}`}>
              Date de fin
            </Label>
            <Input
              id={`end-date-${slot.id || "new"}`}
              type="date"
              value={formatDate(endDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(endDate.getHours());
                newDate.setMinutes(endDate.getMinutes());
                handleChange("endTime", newDate.toISOString());
              }}
              min={formatDate(startDate)}
              max={formatDate(eventEndDate)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`end-time-${slot.id || "new"}`}>
              Heure de fin
            </Label>
            <Input
              id={`end-time-${slot.id || "new"}`}
              type="time"
              value={formatTime(endDate)}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":");
                const newDate = new Date(endDate);
                newDate.setHours(parseInt(hours));
                newDate.setMinutes(parseInt(minutes));
                handleChange("endTime", newDate.toISOString());
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`max-participants-${slot.id || "new"}`}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Nombre max total de participants
          </Label>
          <Input
            id={`max-participants-${slot.id || "new"}`}
            type="number"
            min="1"
            value={localSlot.maxParticipants}
            onChange={(e) =>
              handleChange("maxParticipants", parseInt(e.target.value) || 1)
            }
          />
          {totalMaxFromMissions > 0 && (
            <p className="text-xs text-muted-foreground">
              Total des missions : {totalMaxFromMissions} personne{totalMaxFromMissions > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Separator />

        {/* Liste des missions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Missions ({localSlot.missions.length})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMission}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une mission
            </Button>
          </div>

          {localSlot.missions.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
              Aucune mission définie. Cliquez sur &quot;Ajouter une mission&quot; pour commencer.
            </div>
          ) : (
            <div className="space-y-3">
              {localSlot.missions.map((mission, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        Mission {index + 1}
                      </Badge>
                      {localSlot.missions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMission(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type de mission</Label>
                        <Select
                          value={mission.type}
                          onValueChange={(value) =>
                            updateMission(index, {
                              ...mission,
                              type: value as MissionType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MISSION_TYPES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Nombre de personnes</Label>
                        <Input
                          type="number"
                          min="1"
                          value={mission.maxParticipants}
                          onChange={(e) =>
                            updateMission(index, {
                              ...mission,
                              maxParticipants: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    </div>

                    {mission.type === "autre" && (
                      <div className="space-y-2">
                        <Label>Description de la mission</Label>
                        <Textarea
                          placeholder="Décrivez la mission..."
                          value={mission.description || ""}
                          onChange={(e) =>
                            updateMission(index, {
                              ...mission,
                              description: e.target.value,
                            })
                          }
                          className="min-h-[60px]"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
