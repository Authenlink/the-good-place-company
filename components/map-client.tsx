"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngExpression, DivIcon } from "leaflet";
import * as L from "leaflet";
import type { Control as LeafletControl } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Globe, ExternalLink, Zap } from "lucide-react";

// Import CSS de Leaflet
import "leaflet/dist/leaflet.css";

// Types pour la personnalisation
type MapVariant = "default" | "dark";

interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
  logo?: string;
  website?: string;
  size?: string;
  area?: { name: string };
  values?: string[];
}

interface CityCount {
  city: string;
  count: number;
}

interface MapVariantsProps {
  companies: Company[];
  cityCounts?: CityCount[];
  variant?: "default" | "dark";
  markerStyle?: "default" | "colored" | "numbered" | "icon";
  popupStyle?: "compact" | "detailed";
  showClusters?: boolean;
  showHeatmap?: boolean;
  city?: string | null;
  onVariantChange?: (variant: "default" | "dark") => void;
  className?: string;
}

interface MapControllerProps {
  city?: string | null;
}

// COORDONNÉES DES VILLES
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
};

// THÈMES ET STYLES DE CARTE
interface MapTheme {
  url: string;
  attribution: string;
  ext?: string;
  subdomains?: string;
}

const MAP_THEMES: Record<string, MapTheme> = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  minimal: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  watercolor: {
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}",
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    ext: "jpg",
    subdomains: "abcd",
  },
};

// MARQUEURS PERSONNALISÉS SIMPLES
const createColoredMarker = (color: string) => {
  return new DivIcon({
    html: `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: white;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
};

const createNumberedMarker = (number: number, color: string = "#00c951") => {
  return new DivIcon({
    html: `
    <div style="
      background-color: ${color};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      transform-origin: center;
    ">
      <span style="transform: rotate(45deg);">${number}</span>
    </div>
  `,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

const createIconMarker = (iconHtml: string, bgColor: string = "#00c951") => {
  return new DivIcon({
    html: `
    <div style="
      background-color: ${bgColor};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transform-origin: center;
    ">
      <span style="transform: rotate(45deg);">${iconHtml}</span>
    </div>
  `,
    className: "custom-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

const createDefaultMarker = () => {
  return new DivIcon({
    html: `
    <div style="
      background-color: #00c951;
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
    "></div>
  `,
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
};

const createCityMarker = (count: number) => {
  return new DivIcon({
    html: `
    <div style="
      background-color: #00c951;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      transform-origin: center;
    ">
      <span style="transform: rotate(45deg);">${count}</span>
    </div>
  `,
    className: "custom-marker city-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// POPUPS PERSONNALISÉS
const CompactPopup = ({
  company,
  onViewProfile,
}: {
  company: Company;
  onViewProfile?: (companyName: string) => void;
}) => {
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(company.name);
    }
  };

  return (
    <Card className="w-64 border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={company.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-md object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate text-card-foreground">
              {company.name}
            </h4>
            {company.area?.name && (
              <Badge variant="secondary" className="text-xs h-4">
                {company.area.name}
              </Badge>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="w-full text-xs h-7"
          onClick={handleViewProfile}
        >
          Voir le profil
        </Button>
      </CardContent>
    </Card>
  );
};

const DetailedPopup = ({
  company,
  onViewProfile,
}: {
  company: Company;
  onViewProfile?: (companyName: string) => void;
}) => {
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(company.name);
    }
  };

  return (
    <Card className="w-80 border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={company.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-border">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1 text-card-foreground">
              {company.name}
            </h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {company.area?.name && (
                <Badge variant="secondary" className="text-xs">
                  {company.area.name}
                </Badge>
              )}
              {company.size && (
                <Badge variant="outline" className="text-xs">
                  {company.size}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {company.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {company.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{company.address}</span>
            </div>
          )}
          {company.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                Site web
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleViewProfile}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Voir profil
          </Button>
          <Button size="sm" variant="outline">
            <Zap className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CityPopup = ({
  city,
  count,
  onViewCity,
}: {
  city: string;
  count: number;
  onViewCity?: (cityName: string) => void;
}) => {
  const handleViewCity = () => {
    if (onViewCity) {
      onViewCity(city);
    }
  };

  return (
    <Card className="w-64 border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 flex items-center justify-center border border-green-200">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1 text-card-foreground">
              {city}
            </h3>
            <p className="text-sm text-muted-foreground">
              {count} association{count > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button size="sm" className="w-full" onClick={handleViewCity}>
          <ExternalLink className="w-4 h-4 mr-1" />
          Voir les associations
        </Button>
      </CardContent>
    </Card>
  );
};

// Composant pour contrôler la carte (centrage)
function MapController({ city }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (city && CITY_COORDINATES[city]) {
      const coords = CITY_COORDINATES[city] as LatLngExpression;
      map.setView(coords, 12);
    } else if (city) {
      // Géocodage de la ville si elle n'est pas dans la liste
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          city
        )},France&limit=1`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12);
          }
        })
        .catch(() => {
          // Ignore les erreurs de géocodage
        });
    }
  }, [city, map]);

  return null;
}

// Composant pour gérer le redimensionnement automatique de la carte
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

    const handleResize = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

// Contrôle personnalisé pour changer le style de la carte
function MapStyleControl({
  currentVariant,
  onVariantChange,
}: {
  currentVariant: MapVariant;
  onVariantChange: (variant: MapVariant) => void;
}) {
  const map = useMap();

  useEffect(() => {
    let currentControl: LeafletControl | null = null;

    const initControl = () => {
      // Vérifier que la carte est prête
      if (!map || typeof map.addControl !== "function") {
        return;
      }

      if (currentControl) {
        try {
          map.removeControl(currentControl);
        } catch {
          // Ignore les erreurs si le contrôle n'existe pas
        }
      }

      const MapStyleControl = L.Control.extend({
        options: {
          position: "topright",
        },

        onAdd: function () {
          const container = L.DomUtil.create(
            "div",
            "leaflet-control leaflet-control-custom"
          );

          const nextTheme = currentVariant === "dark" ? "default" : "dark";
          const isDarkTheme = currentVariant === "dark";
          const themeTitle = isDarkTheme
            ? "Passer en mode clair"
            : "Passer en mode sombre";

          const backgroundColor = isDarkTheme
            ? "rgba(0, 0, 0, 0.7)"
            : "rgba(255, 255, 255, 0.9)";

          const borderColor = isDarkTheme
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.1)";

          const button = document.createElement("button");
          button.id = `map-style-toggle-${Date.now()}`;
          button.title = themeTitle;
          button.style.cssText = `
            background: ${backgroundColor};
            backdrop-filter: blur(10px);
            border: 1px solid ${borderColor};
            border-radius: 6px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            color: ${isDarkTheme ? "#ffffff" : "#000000"};
          `;

          const iconContainer = document.createElement("div");
          iconContainer.style.cssText =
            "display: flex; align-items: center; justify-content: center;";
          iconContainer.innerHTML = isDarkTheme
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

          button.appendChild(iconContainer);
          container.appendChild(button);

          button.addEventListener("click", (e) => {
            e.preventDefault();
            onVariantChange(nextTheme);
          });

          L.DomEvent.disableClickPropagation(container);
          L.DomEvent.disableScrollPropagation(container);

          return container;
        },
      });

      currentControl = new MapStyleControl();

      // Vérifier que le contrôle a bien été créé avant de l'ajouter
      if (currentControl && typeof currentControl.addTo === "function") {
        currentControl.addTo(map);
      }
    };

    initControl();

    return () => {
      if (currentControl) {
        try {
          map.removeControl(currentControl);
        } catch {
          // Ignore les erreurs
        }
      }
    };
  }, [map, currentVariant, onVariantChange]);

  return null;
}

export default function MapClient({
  companies,
  cityCounts = [],
  variant: initialVariant = "dark",
  markerStyle = "default",
  popupStyle = "detailed",
  city,
  onVariantChange,
  className = "h-[500px] sm:h-[600px] lg:h-[700px]",
}: MapVariantsProps) {
  const router = useRouter();
  const [currentVariant, setCurrentVariant] = useState<MapVariant>(
    (["default", "dark"].includes(initialVariant)
      ? initialVariant
      : "dark") as MapVariant
  );
  const [markers, setMarkers] = useState<
    Array<{
      id: number;
      position: LatLngExpression;
      company: Company;
    }>
  >([]);

  const handleViewProfile = useCallback(
    (companyName: string) => {
      router.push(`/company/${encodeURIComponent(companyName)}`);
    },
    [router]
  );

  const handleViewCity = useCallback(
    (cityName: string) => {
      router.push(`/map?city=${encodeURIComponent(cityName)}`);
    },
    [router]
  );

  const variant: MapVariant = onVariantChange
    ? (initialVariant as MapVariant)
    : currentVariant;

  const handleVariantChange = useCallback(
    (newVariant: MapVariant) => {
      if (onVariantChange) {
        onVariantChange(newVariant);
      } else {
        setCurrentVariant(newVariant);
      }
    },
    [onVariantChange]
  );

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
        console.log(`🔍 Traitement entreprise: ${company.name}`);
        console.log(`   Adresse: ${company.address}, Ville: ${company.city}`);
        console.log(`   Coordonnées brutes:`, company.coordinates);

        if (
          company.coordinates &&
          company.coordinates.lat &&
          company.coordinates.lng
        ) {
          console.log(
            `✅ Utilisation coordonnées existantes: ${company.coordinates.lat}, ${company.coordinates.lng}`
          );
          geocodedMarkers.push({
            id: company.id,
            position: [
              company.coordinates.lat,
              company.coordinates.lng,
            ] as LatLngExpression,
            company,
          });
        } else if (company.address && company.city) {
          // Géocodage depuis l'adresse
          let found = false;

          const addressFormats = [
            `${company.address}, ${company.city}, France`,
            `${company.address}, Marseille, France`,
            `${company.city}, France`,
          ];

          if (
            company.city === "Marseille" &&
            company.address?.toLowerCase().includes("chateauredon")
          ) {
            addressFormats.unshift("12 rue Chateauredon, Marseille, France");
          }

          // Essayer Google Maps
          const GOOGLE_MAPS_API_KEY =
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (GOOGLE_MAPS_API_KEY && !found) {
            try {
              const googleQuery = encodeURIComponent(
                `${company.address}, ${company.city}, France`
              );
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${googleQuery}&key=${GOOGLE_MAPS_API_KEY}&region=fr&language=fr`
              );

              if (response.ok) {
                const data = await response.json();
                if (data.status === "OK" && data.results.length > 0) {
                  const location = data.results[0].geometry.location;
                  const position: LatLngExpression = [
                    location.lat,
                    location.lng,
                  ];
                  geocodedMarkers.push({ id: company.id, position, company });
                  found = true;
                }
              }
            } catch (error) {
              console.error("Erreur Google Maps:", error);
            }
          }

          // Fallback vers Nominatim
          for (const query of addressFormats) {
            if (found) break;

            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  query
                )}&limit=1&countrycodes=fr&addressdetails=1`
              );

              if (!response.ok) continue;

              const data = await response.json();
              if (data && data.length > 0 && data[0].lat && data[0].lon) {
                const position: LatLngExpression = [
                  parseFloat(data[0].lat),
                  parseFloat(data[0].lon),
                ];
                geocodedMarkers.push({ id: company.id, position, company });
                found = true;
              }
            } catch (error) {
              console.error("Erreur Nominatim:", error);
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          if (!found) {
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

      console.log(
        `📍 ${geocodedMarkers.length} marqueurs créés pour ${companies.length} entreprises`
      );
      setMarkers(geocodedMarkers);
    };

    geocodeCompanies();
  }, [companies]);

  const theme = MAP_THEMES[variant];

  const [markerIcons, setMarkerIcons] = useState<Map<string, DivIcon>>(
    new Map()
  );

  useEffect(() => {
    const initMarkerIcons = () => {
      const icons = new Map<string, DivIcon>();

      for (let i = 0; i < markers.length; i++) {
        const key = `${markerStyle}-${i}`;
        let icon;

        switch (markerStyle) {
          case "colored":
            icon = createColoredMarker("#00c951");
            break;
          case "numbered":
            icon = createNumberedMarker(i + 1);
            break;
          case "icon":
            icon = createIconMarker("🏢", "#00c951");
            break;
          default:
            icon = createDefaultMarker();
            break;
        }

        icons.set(key, icon);
      }

      setMarkerIcons(icons);
    };

    if (markers.length > 0) {
      initMarkerIcons();
    }
  }, [markers, markerStyle]);

  const getMarkerIcon = (company: Company, index: number) => {
    const key = `${markerStyle}-${index}`;
    const icon = markerIcons.get(key);

    // Retourner l'icône si elle existe, sinon une icône par défaut
    return icon || createDefaultMarker();
  };

  const getPopup = (company: Company) => {
    switch (popupStyle) {
      case "compact":
        return (
          <CompactPopup company={company} onViewProfile={handleViewProfile} />
        );
      case "detailed":
      default:
        return (
          <DetailedPopup company={company} onViewProfile={handleViewProfile} />
        );
    }
  };

  return (
    <div
      className={`w-full ${className} rounded-lg overflow-hidden relative ${
        variant === "dark" ? "dark" : ""
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }

          .leaflet-control-zoom a {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border: none !important;
            color: #374151 !important;
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            text-align: center !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
          }

          .leaflet-control-zoom a:hover {
            background: rgba(255, 255, 255, 1) !important;
            color: #1f2937 !important;
            transform: scale(1.05) !important;
          }

          .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 12px;
            background: transparent !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .leaflet-popup-content {
            margin: 0;
            line-height: 1.4;
          }

          .custom-popup .leaflet-popup-content-wrapper {
            background: transparent !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          }
        `,
        }}
      />
      <MapContainer
        center={
          city && CITY_COORDINATES[city]
            ? CITY_COORDINATES[city]
            : [48.8566, 2.3522]
        }
        zoom={city ? 12 : 6}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url={theme.url}
          attribution={theme.attribution}
          {...(theme.ext && { ext: theme.ext })}
          {...(theme.subdomains && { subdomains: theme.subdomains })}
        />

        <MapController city={city} />
        <MapResizer />
        <MapStyleControl
          currentVariant={variant}
          onVariantChange={handleVariantChange}
        />

        {(() => {
          // Si on a des comptages de villes (vue générale), afficher les markers de villes
          if (cityCounts.length > 0) {
            console.log(
              `🗺️ Rendu de ${cityCounts.length} marqueurs de villes sur la carte`
            );
            return cityCounts.map((cityCount) => {
              const cityCoords = CITY_COORDINATES[cityCount.city];
              if (!cityCoords) return null;

              const cityMarkerIcon = createCityMarker(cityCount.count);
              return (
                <Marker
                  key={`city-${cityCount.city}`}
                  position={cityCoords}
                  icon={cityMarkerIcon}
                >
                  <Popup closeButton={false} className="custom-popup">
                    <CityPopup
                      city={cityCount.city}
                      count={cityCount.count}
                      onViewCity={handleViewCity}
                    />
                  </Popup>
                </Marker>
              );
            });
          }

          // Sinon, afficher les markers d'entreprises individuels
          console.log(
            `🗺️ Rendu de ${markers.length} marqueurs d'entreprises sur la carte`
          );
          return markers.map((marker, index) => {
            const markerIcon = getMarkerIcon(marker.company, index);
            return (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={markerIcon}
              >
                <Popup closeButton={false} className="custom-popup">
                  {getPopup(marker.company)}
                </Popup>
              </Marker>
            );
          });
        })()}
      </MapContainer>
    </div>
  );
}
