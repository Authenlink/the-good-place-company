"use client";

import { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cities } from "@/lib/cities";

interface CitySelectionDialogProps {
  open: boolean;
  onCitySelected: (city: string) => void;
}

export function CitySelectionDialog({
  open,
  onCitySelected,
}: CitySelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) {
      return cities; // Show all cities when no search
    }
    const searchLower = searchTerm.toLowerCase();
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  const handleCitySelect = async (cityName: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referencedCity: cityName,
        }),
      });

      if (response.ok) {
        onCitySelected(cityName);
        setSearchTerm("");
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Error updating city:", err);
      setError("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col" 
        onInteractOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">
            Sélectionnez votre ville de référence
          </DialogTitle>
          <DialogDescription className="text-base">
            Choisissez une ville pour voir les événements qui vous concernent.
            Pas de soucis, vous pouvez changer et dans la partie &quot;Découvrir&quot; voir tous les événements.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Search bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex-shrink-0">
              {error}
            </div>
          )}

          {/* Cities grid with scroll */}
          <div className="flex-1 overflow-y-auto pr-2">
            {filteredCities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {filteredCities.map((city) => (
                  <Card
                    key={city.name}
                    className={`${city.color} text-white cursor-pointer transition-transform hover:scale-105 hover:shadow-lg ${
                      saving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !saving && handleCitySelect(city.name)}
                  >
                    <CardContent className="p-6 h-32 flex items-start justify-start">
                      <h3 className="text-2xl font-bold">{city.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm
                    ? `Aucune ville trouvée pour "${searchTerm}"`
                    : "Aucune ville disponible"}
                </p>
              </div>
            )}
          </div>

          {/* Saving indicator */}
          {saving && (
            <div className="flex items-center justify-center py-4 flex-shrink-0">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Mise à jour en cours...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
