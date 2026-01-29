"use client";

import { useState } from "react";
import { HelpCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface PlanningPrerequisiteDialogProps {
  onDismiss?: () => void;
}

export function PlanningPrerequisiteDialog({ onDismiss }: PlanningPrerequisiteDialogProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    onDismiss?.();
  };

  const handleReopen = () => {
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleReopen}
        className="h-8 w-8 p-0"
        title="Information - Prérequis pour le planning"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Prérequis pour créer un planning
            </DialogTitle>
            <DialogDescription>
              Avant de pouvoir créer un planning, vous devez d&apos;abord définir les dates et horaires de votre événement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date et heure de début
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vous devez renseigner la <strong>date de début</strong> et l&apos;<strong>heure de début</strong> de votre événement dans la section &quot;Date et horaires&quot; ci-dessus.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Date et heure de fin (recommandé)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Bien que la date et l&apos;heure de fin soient optionnelles, elles sont <strong>fortement recommandées</strong> pour créer un planning. Elles permettent de :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-2 list-disc">
                  <li>Générer automatiquement des créneaux sur toute la durée de l&apos;événement</li>
                  <li>Définir précisément la période couverte par le planning</li>
                  <li>Éviter les erreurs lors de la création des créneaux</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 text-primary">
                  💡 Astuce
                </h4>
                <p className="text-sm text-muted-foreground">
                  Une fois les dates et horaires renseignés, vous pourrez accéder à l&apos;onglet &quot;Planning&quot; pour créer des créneaux horaires avec des missions spécifiques pour chaque créneau.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} variant="default">
                J&apos;ai compris
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
