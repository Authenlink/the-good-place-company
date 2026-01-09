"use client";

import dynamic from "next/dynamic";

interface MapVariantsProps {
  companies: any[];
  variant?: "default" | "dark";
  markerStyle?: "default" | "colored" | "numbered" | "icon";
  popupStyle?: "compact" | "detailed";
  showClusters?: boolean;
  showHeatmap?: boolean;
  city?: string | null;
  onVariantChange?: (variant: "default" | "dark") => void;
  className?: string;
}

// Composant de carte client-only pour éviter les erreurs SSR
const MapClient = dynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default function MapVariants(props: MapVariantsProps) {
  return <MapClient {...props} />;
}
