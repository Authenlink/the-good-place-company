"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventSlotSelector } from "@/components/event-slot-selector";
import { Separator } from "@/components/ui/separator";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  missionType?: string;
  missionDescription?: string | null;
  missions?: Array<{
    type: string;
    description?: string | null;
    maxParticipants: number;
    registeredCount?: number;
    availableSpots?: number;
  }>;
  registeredCount: number;
  prefilledCount: number;
  totalCount: number;
  availableSpots: number;
}

interface EventRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: Slot[];
  onRegister: (slotId: number | null, missionType: string | null) => Promise<void>;
  isSubmitting?: boolean;
  isFull?: boolean;
}

export function EventRegistrationDialog({
  open,
  onOpenChange,
  slots,
  onRegister,
  isSubmitting = false,
  isFull = false,
}: EventRegistrationDialogProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedMissionType, setSelectedMissionType] = useState<string | null>(null);

  const handleSelect = (slotId: number, missionType?: string) => {
    // Si on change de créneau, réinitialiser la mission
    if (selectedSlotId !== slotId) {
      setSelectedMissionType(null);
    }
    setSelectedSlotId(slotId);
    if (missionType) {
      setSelectedMissionType(missionType);
    }
  };

  const handleRegister = async () => {
    await onRegister(selectedSlotId, selectedMissionType);
    // Ne pas fermer automatiquement, laisser le parent gérer
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSlotId(null);
      setSelectedMissionType(null);
      onOpenChange(false);
    }
  };

  // Réinitialiser les sélections quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedSlotId(null);
      setSelectedMissionType(null);
    }
  }, [open]);

  // Vérifier si une mission est requise
  const needsMission = (() => {
    if (!selectedSlotId || !slots) return false;
    const slot = slots.find((s) => s.id === selectedSlotId);
    return !!(
      slot &&
      "missions" in slot &&
      slot.missions &&
      slot.missions.length > 0 &&
      !selectedMissionType
    );
  })();

  const canRegister = slots.length === 0 || (!needsMission && selectedSlotId !== null);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            Sélectionnez votre créneau
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choisissez le créneau horaire et la mission pour vous inscrire à cet événement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6 py-2 sm:py-4 -mx-2 sm:-mx-0 px-2 sm:px-0">
          {slots.length > 0 ? (
            <>
              <EventSlotSelector
                slots={slots}
                onSelect={handleSelect}
                selectedSlotId={selectedSlotId}
                selectedMissionType={selectedMissionType}
                isSubmitting={isSubmitting}
              />
              <Separator />
            </>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground px-2">
              <p className="text-sm sm:text-base">Cet événement n&apos;a pas de planning avec créneaux horaires.</p>
              <p className="text-xs sm:text-sm mt-2">Vous pouvez vous inscrire directement.</p>
            </div>
          )}

          {needsMission && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                Veuillez sélectionner une mission pour ce créneau avant de confirmer votre inscription.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleRegister}
            disabled={isSubmitting || !canRegister}
            title={needsMission ? "Veuillez sélectionner une mission" : ""}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting
              ? "Traitement..."
              : isFull
              ? "S'inscrire sur la liste d'attente"
              : "Confirmer l'inscription"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
