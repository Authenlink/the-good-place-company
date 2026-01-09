"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  Save,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number;
  name: string;
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
}

export default function GeocodeAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResult, setSearchResult] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCompaniesWithoutCoordinates();
  }, []);

  const loadCompaniesWithoutCoordinates = async () => {
    try {
      const response = await fetch("/api/admin/companies-without-coordinates");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error("Erreur chargement entreprises:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchCoordinates = async () => {
    if (!searchAddress.trim()) return;

    try {
      const query = encodeURIComponent(searchAddress + ", France");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=fr`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          setSearchResult(coords);
          toast({
            title: "Coordonnées trouvées",
            description: `Latitude: ${coords.lat}, Longitude: ${coords.lng}`,
          });
        } else {
          setSearchResult(null);
          toast({
            title: "Aucun résultat",
            description:
              "Adresse introuvable. Essayez une formulation différente.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les coordonnées.",
        variant: "destructive",
      });
    }
  };

  const saveCoordinates = async (
    companyId: number,
    coordinates: { lat: number; lng: number }
  ) => {
    try {
      const response = await fetch(
        `/api/admin/companies/${companyId}/coordinates`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates }),
        }
      );

      if (response.ok) {
        toast({
          title: "Coordonnées sauvegardées",
          description: "Les coordonnées GPS ont été mises à jour.",
        });
        // Recharger la liste
        loadCompaniesWithoutCoordinates();
        setSelectedCompany(null);
        setSearchResult(null);
        setSearchAddress("");
      } else {
        throw new Error("Erreur sauvegarde");
      }
    } catch (error) {
      toast({
        title: "Erreur sauvegarde",
        description: "Impossible de sauvegarder les coordonnées.",
        variant: "destructive",
      });
    }
  };

  const openInGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
    window.open(url, "_blank");
  };

  const openInOpenStreetMap = (address: string) => {
    const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
      address
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6" />
        <h1 className="text-2xl font-bold">
          Administration - Géocodage des entreprises
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des entreprises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Entreprises sans coordonnées</span>
              <Badge variant="secondary">{companies.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : companies.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCompany?.id === company.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{company.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {company.address}, {company.city}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(
                              `${company.address}, ${company.city}`
                            );
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-gray-600">
                  Toutes les entreprises ont des coordonnées GPS ! 🎉
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outil de géocodage */}
        <Card>
          <CardHeader>
            <CardTitle>Outil de géocodage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCompany ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">
                    {selectedCompany.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedCompany.address}, {selectedCompany.city}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="address">Rechercher une adresse</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      placeholder="12 rue Chateauredon, Marseille"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && searchCoordinates()
                      }
                    />
                    <Button onClick={searchCoordinates} size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {searchResult && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Coordonnées trouvées
                      </span>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>Latitude: {searchResult.lat}</p>
                      <p>Longitude: {searchResult.lng}</p>
                    </div>
                    <Button
                      onClick={() =>
                        saveCoordinates(selectedCompany.id, searchResult)
                      }
                      size="sm"
                      className="mt-3 w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder ces coordonnées
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openInGoogleMaps(
                        `${selectedCompany.address}, ${selectedCompany.city}`
                      )
                    }
                    className="flex-1"
                  >
                    Google Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openInOpenStreetMap(
                        `${selectedCompany.address}, ${selectedCompany.city}`
                      )
                    }
                    className="flex-1"
                  >
                    OpenStreetMap
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Sélectionnez une entreprise pour commencer
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-2">📍 Méthode recommandée :</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-4">
              <li>Cliquez sur une entreprise dans la liste</li>
              <li>Cliquez sur "Google Maps" pour voir l'adresse exacte</li>
              <li>
                Clic droit sur la carte → "Coordonnées" pour obtenir lat/lng
              </li>
              <li>Saisissez l'adresse exacte dans le champ de recherche</li>
              <li>Sauvegardez les coordonnées trouvées</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">🔧 Géocodage automatique :</h4>
            <p className="text-gray-600">
              Pour géocoder automatiquement toutes les entreprises, exécutez :
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                npx tsx geocode-companies-simple.js
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
