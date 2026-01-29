"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MemberType } from "@/lib/schema";
import { MEMBER_TYPES } from "@/lib/schema";

interface Company {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  city?: string;
  participantCount: number;
}

interface CompanyMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembershipAdded: () => void;
  existingMemberships?: number[]; // IDs des associations déjà ajoutées
}

export function CompanyMembershipDialog({
  open,
  onOpenChange,
  onMembershipAdded,
  existingMemberships = [],
}: CompanyMembershipDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingCompanyId, setAddingCompanyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMemberTypeDialog, setShowMemberTypeDialog] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState<number | null>(null);
  const [selectedMemberType, setSelectedMemberType] = useState<MemberType>("volunteer");
  const { toast } = useToast();

  // Récupérer la liste des villes uniques depuis les associations
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    companies.forEach((company) => {
      if (company.city) {
        citySet.add(company.city);
      }
    });
    return Array.from(citySet).sort();
  }, [companies]);

  // Charger les associations avec debounce sur la recherche
  useEffect(() => {
    if (!open) {
      // Reset les filtres quand le dialog se ferme
      setSearchTerm("");
      setSelectedCity("");
      return;
    }

    // Debounce pour la recherche
    const timeoutId = setTimeout(
      () => {
        const fetchCompanies = async () => {
          setLoading(true);
          setError(null);
          try {
            const params = new URLSearchParams();
            if (searchTerm.trim()) {
              params.append("search", searchTerm.trim());
            }
            if (selectedCity) {
              params.append("city", selectedCity);
            }

            const response = await fetch(
              `/api/companies/search?${params.toString()}`,
            );
            if (response.ok) {
              const data = await response.json();
              setCompanies(data.companies || []);
            } else {
              const errorData = await response.json();
              setError(
                errorData.error || "Erreur lors du chargement des associations",
              );
            }
          } catch (err) {
            console.error("Error loading companies:", err);
            setError("Erreur lors du chargement des associations");
          } finally {
            setLoading(false);
          }
        };
        fetchCompanies();
      },
      searchTerm ? 300 : 0,
    ); // Délai de 300ms si recherche, sinon immédiat

    return () => clearTimeout(timeoutId);
  }, [open, searchTerm, selectedCity]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (selectedCity) {
        params.append("city", selectedCity);
      }

      const response = await fetch(
        `/api/companies/search?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Erreur lors du chargement des associations",
        );
      }
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Erreur lors du chargement des associations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompanyClick = (companyId: number) => {
    if (existingMemberships.includes(companyId)) {
      return; // Déjà ajoutée
    }
    setPendingCompanyId(companyId);
    setSelectedMemberType("volunteer"); // Reset à la valeur par défaut
    setShowMemberTypeDialog(true);
  };

  const handleConfirmAddCompany = async () => {
    if (!pendingCompanyId) return;

    setAddingCompanyId(pendingCompanyId);
    setShowMemberTypeDialog(false);
    
    try {
      const response = await fetch("/api/user/profile/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          companyId: pendingCompanyId,
          memberType: selectedMemberType,
        }),
      });

      if (response.ok) {
        toast({
          title: "Association ajoutée",
          description: "L'association a été ajoutée à votre profil.",
        });
        onMembershipAdded();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Erreur lors de l'ajout de l'association",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error adding company:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'association",
        variant: "destructive",
      });
    } finally {
      setAddingCompanyId(null);
      setPendingCompanyId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    // Le filtrage est déjà fait côté serveur, mais on peut aussi filtrer côté client si nécessaire
    return companies;
  }, [companies]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">
            Ajouter une association
          </DialogTitle>
          <DialogDescription className="text-base">
            Sélectionnez les associations pour lesquelles vous participez à des
            événements.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Filtres */}
          <div className="flex gap-4 flex-shrink-0">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher une association..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par ville */}
            <Select
              value={selectedCity || "all"}
              onValueChange={(value) =>
                setSelectedCity(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex-shrink-0">
              {error}
            </div>
          )}

          {/* Liste des associations */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Chargement...</span>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="space-y-2">
                {filteredCompanies.map((company) => {
                  const isAlreadyAdded = existingMemberships.includes(
                    company.id,
                  );
                  const isAdding = addingCompanyId === company.id;

                  return (
                    <div
                      key={company.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isAlreadyAdded
                          ? "bg-muted/50 border-muted"
                          : "hover:bg-accent"
                      }`}
                    >
                      {/* Logo */}
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage
                          src={company.logo || ""}
                          alt={company.name}
                        />
                        <AvatarFallback>
                          {company.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Informations */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {company.city && (
                            <span className="text-sm text-muted-foreground">
                              {company.city}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {company.participantCount} participant
                            {company.participantCount > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Bouton d'action */}
                      {isAlreadyAdded ? (
                        <Button
                          variant="outline"
                          disabled
                          className="flex-shrink-0"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Déjà ajoutée
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          onClick={() => handleAddCompanyClick(company.id)}
                          disabled={isAdding}
                          className="flex-shrink-0"
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ajout...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm || selectedCity
                    ? "Aucune association trouvée"
                    : "Aucune association disponible"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Dialog de sélection du type de membre */}
      <Dialog open={showMemberTypeDialog} onOpenChange={setShowMemberTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Type de membre</DialogTitle>
            <DialogDescription>
              Sélectionnez votre type de participation à cette association
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedMemberType}
              onValueChange={(value) => setSelectedMemberType(value as MemberType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volunteer">
                  {MEMBER_TYPES.volunteer}
                </SelectItem>
                <SelectItem value="permanent_member">
                  {MEMBER_TYPES.permanent_member}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMemberTypeDialog(false);
                setPendingCompanyId(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmAddCompany}>
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
