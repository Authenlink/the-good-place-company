"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EVENT_TYPES, EventType } from "@/lib/schema";

interface UnvalidatedEvent {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  status: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export function EventValidationDialog() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<UnvalidatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    // Ne vérifier que pour les comptes business
    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      fetchUnvalidatedEvents();
    }
  }, [status, session]);

  const fetchUnvalidatedEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/events/unvalidated");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        // Ouvrir le dialog s'il y a des événements non validés
        setOpen(data.length > 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (eventId: number, validated: boolean) => {
    setValidating(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}/validate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ validated }),
      });

      if (response.ok) {
        toast({
          title: "Événement validé",
          description: validated
            ? "L'événement a été marqué comme présent"
            : "L'événement a été marqué comme absent",
        });

        // Retirer l'événement de la liste
        setEvents((prev) => prev.filter((e) => e.id !== eventId));

        // Si plus d'événements, fermer le dialog
        if (events.length === 1) {
          setOpen(false);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de valider l'événement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation",
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  // Ne rien afficher si pas de session business ou si pas d'événements
  if (
    status !== "authenticated" ||
    session?.user?.accountType !== "business" ||
    (!loading && events.length === 0)
  ) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validation des événements passés
          </DialogTitle>
          <DialogDescription>
            Vous avez {events.length} événement{events.length > 1 ? "s" : ""}{" "}
            passé{events.length > 1 ? "s" : ""} à valider. Pour chaque événement,
            veuillez indiquer s'il a réellement eu lieu ou s'il a été annulé.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const startDate = new Date(event.startDate);
              const endDate = event.endDate ? new Date(event.endDate) : null;
              const isValidating = validating === event.id;

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {EVENT_TYPES[event.eventType]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(startDate, "d MMMM yyyy 'à' HH:mm", {
                              locale: fr,
                            })}
                            {endDate &&
                              ` - ${format(endDate, "HH:mm", { locale: fr })}`}
                          </span>
                        </div>
                        {(event.location || event.city) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {event.location || event.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleValidate(event.id, true)}
                        disabled={isValidating}
                        className="flex-1"
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        A eu lieu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(event.id, false)}
                        disabled={isValidating}
                        className="flex-1"
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        N'a pas eu lieu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={events.length > 0}
          >
            {events.length === 0 ? "Fermer" : "Fermer (il reste des événements à valider)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
