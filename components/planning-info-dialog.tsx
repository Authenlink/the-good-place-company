"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_KEY = "event-planning-info-dismissed";

interface PlanningInfoDialogProps {
  onDismiss?: () => void;
}

export function PlanningInfoDialog({ onDismiss }: PlanningInfoDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Vérifier si la popup a déjà été fermée
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
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
        title="Aide - Comment utiliser le planning"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Comment utiliser le planning ?
            </DialogTitle>
            <DialogDescription>
              Guide rapide pour créer et gérer les créneaux de votre événement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">1.</span> Activer le planning
                </h4>
                <p className="text-sm text-muted-foreground">
                  Activez le switch &quot;Activer le planning&quot; pour permettre aux participants de choisir un créneau lors de l&apos;inscription.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">2.</span> Configurer la durée des créneaux
                </h4>
                <p className="text-sm text-muted-foreground">
                  Définissez la durée de chaque créneau (en minutes). Cette durée sera utilisée pour générer automatiquement les créneaux ou lors de l&apos;ajout manuel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">3.</span> Créer des créneaux
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Vous avez deux options :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>
                    <strong>Génération automatique :</strong> Cliquez sur &quot;Générer automatiquement&quot; pour créer des créneaux sur toute la durée de l&apos;événement
                  </li>
                  <li>
                    <strong>Ajout manuel :</strong> Cliquez sur une heure dans le calendrier pour ajouter un créneau à cette heure précise
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">4.</span> Configurer chaque créneau
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Pour chaque créneau, vous pouvez :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Définir le nombre maximum de participants</li>
                  <li>Ajouter plusieurs types de missions (ex: Accueil, Distribution, Logistique)</li>
                  <li>Pour chaque mission, définir le nombre de personnes nécessaires</li>
                  <li>Ajouter une description si vous choisissez le type &quot;Autre&quot;</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">5.</span> Pré-remplir des créneaux
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez pré-remplir certains créneaux avec des membres qui ne sont pas inscrits sur l&apos;application. Cela vous permet de garder une trace de tous les participants, même ceux qui ne passent pas par l&apos;app.
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
