"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import * as L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Globe, ExternalLink } from "lucide-react";

// Import CSS de Leaflet
import "leaflet/dist/leaflet.css";

// Styles personnalisés pour la carte
const mapStyles = `
  .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .leaflet-popup-content {
    margin: 0;
    line-height: 1.4;
  }

  .leaflet-popup-tip {
    background-color: white;
  }

  .leaflet-container {
    font-family: inherit;
  }

  .leaflet-control-container .leaflet-routing-container-hide {
    display: none;
  }

  .leaflet-control-attribution {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
  }

  .leaflet-control-attribution a {
    color: #666;
    text-decoration: none;
  }

  .leaflet-control-attribution a:hover {
    text-decoration: underline;
  }
`;

// Fix pour les icônes Leaflet avec l'approche standard
// @ts-expect-error - Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number }; // Coordonnées GPS directes
  logo?: string;
  website?: string;
  size?: string;
  area?: {
    name: string;
  };
  values?: string[];
  _isApproximateLocation?: boolean; // Indique si la position est approximative (ville seulement)
}

// Coordonnées des villes françaises principales
const CITY_COORDINATES: { [key: string]: [number, number] } = {
  Paris: [48.8566, 2.3522],
  Marseille: [43.2965, 5.3698],
  Lyon: [45.764, 4.8357],
  Toulouse: [43.6047, 1.4442],
  Nice: [43.7102, 7.262],
  Nantes: [47.2184, -1.5536],
  Strasbourg: [48.5734, 7.7521],
  Montpellier: [43.6108, 3.8767],
  Bordeaux: [44.8378, -0.5792],
  Lille: [50.6292, 3.0573],
  Rennes: [48.1173, -1.6778],
  Reims: [49.2583, 4.0317],
  "Saint-Étienne": [45.4397, 4.3872],
  Toulon: [43.1242, 5.928],
  Grenoble: [45.1885, 5.7245],
  Dijon: [47.322, 5.0415],
  Angers: [47.4784, -0.5632],
  Villeurbanne: [45.7719, 4.8902],
  "Saint-Denis": [48.9362, 2.3574],
  "Le Mans": [48.0061, 0.1996],
  "Aix-en-Provence": [43.5297, 5.4474],
  "Clermont-Ferrand": [45.7772, 3.087],
  Brest: [48.3904, -4.4861],
  Limoges: [45.8336, 1.2611],
  Tours: [47.3941, 0.6848],
};

interface MapControllerProps {
  city?: string | null;
}

// Composant pour contrôler la carte (centrage)
function MapController({ city }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (city && CITY_COORDINATES[city]) {
      const coords = CITY_COORDINATES[city] as LatLngExpression;
      map.setView(coords, 12); // Zoom niveau ville
    } else if (city) {
      // Si la ville n'est pas dans la liste, essayer de la géocoder
      geocodeCity(city).then((coords) => {
        if (coords) {
          map.setView(coords, 12);
        }
      });
    }
  }, [city, map]);

  return null;
}

// Fonction pour géocoder une ville (utilise Nominatim - service gratuit)
async function geocodeCity(cityName: string): Promise<LatLngExpression | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName
      )},France&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {}
  return null;
}

interface MapComponentProps {
  city?: string | null;
  companies: Company[];
  loading: boolean;
}

export default function MapComponent({
  city,
  companies,
  loading,
}: MapComponentProps) {
  const [markers, setMarkers] = useState<
    Array<{
      id: number;
      position: LatLngExpression;
      company: Company;
    }>
  >([]);

  // Géocoder les adresses des entreprises
  useEffect(() => {
    const geocodeCompanies = async () => {
      if (companies.length === 0) {
        setMarkers([]);
        return;
      }

      const geocodedMarkers: Array<{
        id: number;
        position: LatLngExpression;
        company: Company;
      }> = [];

      for (const company of companies) {
        // Priorité 1: Utiliser les coordonnées GPS directes si elles existent
        if (
          company.coordinates &&
          company.coordinates.lat &&
          company.coordinates.lng
        ) {
          geocodedMarkers.push({
            id: company.id,
            position: [
              company.coordinates.lat,
              company.coordinates.lng,
            ] as LatLngExpression,
            company,
          });
        }
        // Priorité 2: Géocodage depuis l'adresse
        else if (company.address && company.city) {
          let found = false;

          // Essayer plusieurs formats d'adresse pour maximiser les chances de géocodage
          const addressFormats = [
            `${company.address}, ${company.city}, France`,
            `${company.address}, Marseille, France`, // Forcer Marseille si c'est Marseille
            `${company.city}, France`, // Au pire, juste la ville
          ];

          // Si c'est Marseille et que l'adresse contient "Chateauredon", essayer l'adresse exacte connue
          if (
            company.city === "Marseille" &&
            company.address?.toLowerCase().includes("chateauredon")
          ) {
            addressFormats.unshift("12 rue Chateauredon, Marseille, France");
          }

          // D'abord essayer avec Google Maps si disponible
          const GOOGLE_MAPS_API_KEY =
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

          if (GOOGLE_MAPS_API_KEY && !found) {
            try {
              // Import dynamique de node-geocoder côté client (si nécessaire)
              // Pour le moment, on utilise l'API Google Maps directement
              const googleQuery = encodeURIComponent(
                `${company.address}, ${company.city}, France`
              );
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${googleQuery}&key=${GOOGLE_MAPS_API_KEY}&region=fr&language=fr`
              );

              if (response.ok) {
                const data = await response.json();

                if (
                  data.status === "OK" &&
                  data.results &&
                  data.results.length > 0
                ) {
                  const location = data.results[0].geometry.location;
                  const position: LatLngExpression = [
                    location.lat,
                    location.lng,
                  ];

                  geocodedMarkers.push({
                    id: company.id,
                    position,
                    company,
                  });

                  found = true;
                }
              }
            } catch (error) {}
          }

          // Fallback vers Nominatim si Google Maps échoue ou n'est pas configuré
          for (const query of addressFormats) {
            if (found) break; // Si on a trouvé, on arrête

            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  query
                )}&limit=1&countrycodes=fr&addressdetails=1`
              );

              if (!response.ok) {
                continue;
              }

              const data = await response.json();

              if (data && data.length > 0 && data[0].lat && data[0].lon) {
                const position: LatLngExpression = [
                  parseFloat(data[0].lat),
                  parseFloat(data[0].lon),
                ];

                geocodedMarkers.push({
                  id: company.id,
                  position,
                  company,
                });

                found = true;
              } else {
              }
            } catch (error) {}

            // Petite pause entre les requêtes
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          if (!found) {
            // Fallback: utiliser les coordonnées de la ville
            const cityCoords = CITY_COORDINATES[company.city];
            if (cityCoords) {
              const companyWithFlag = {
                ...company,
                _isApproximateLocation: true,
              };
              geocodedMarkers.push({
                id: company.id,
                position: cityCoords as LatLngExpression,
                company: companyWithFlag,
              });
            }
          }
        }
      }

      setMarkers(geocodedMarkers);
    };

    geocodeCompanies();
  }, [companies]);

  // Coordonnées par défaut (centre de la France)
  const defaultCenter: LatLngExpression =
    city && CITY_COORDINATES[city] ? CITY_COORDINATES[city] : [46.6034, 1.8883]; // Centre de la France

  const defaultZoom = city ? 12 : 6; // Zoom plus rapproché si ville spécifique

  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden relative">
      {/* Styles personnalisés pour la carte */}
      <style dangerouslySetInnerHTML={{ __html: mapStyles }} />

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController city={city} />

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup closeButton={false} className="custom-popup">
              <Card className="w-80 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {marker.company.logo ? (
                      <Image
                        src={marker.company.logo}
                        alt={marker.company.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 border border-gray-200">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 text-gray-900 leading-tight">
                        {marker.company.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        {marker.company.area?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {marker.company.area.name}
                          </Badge>
                        )}
                        {marker.company._isApproximateLocation && (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 border-amber-200"
                          >
                            📍 Position approximative
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {marker.company.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {marker.company.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {marker.company.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="leading-relaxed">
                          {marker.company.address}
                        </span>
                      </div>
                    )}

                    {marker.company.website && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={marker.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate"
                        >
                          {marker.company.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Fermer le popup et naviguer vers la page de l'entreprise
                      window.open(`/company/${marker.company.id}`, "_blank");
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir le profil
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                Chargement des entreprises...
              </p>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
