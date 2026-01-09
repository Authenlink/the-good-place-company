"use client";

import { useEffect, useState } from "react";

interface Company {
  id: number;
  name: string;
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
}

export default function DebugCoordinatesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const fetchCoordinates = async () => {
    try {
      const response = await fetch("/api/debug/coordinates");
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCoordinates = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/debug/coordinates", {
        method: "POST",
      });
      const data = await response.json();
      console.log("Mise à jour terminée:", data);
      // Recharger les données
      await fetchCoordinates();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  const withCoordinates = companies.filter((c) => c.coordinates);
  const withoutCoordinates = companies.filter((c) => !c.coordinates);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Debug - Coordonnées GPS des entreprises
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">
            Total entreprises
          </h3>
          <p className="text-2xl font-bold text-blue-600">{companies.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">
            Avec coordonnées
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {withCoordinates.length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">
            Sans coordonnées
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {withoutCoordinates.length}
          </p>
        </div>
      </div>

      {withoutCoordinates.length > 0 && (
        <div className="mb-8">
          <button
            onClick={updateCoordinates}
            disabled={updating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating
              ? "Mise à jour en cours..."
              : "Ajouter des coordonnées par défaut"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-700">
            ✅ Entreprises avec coordonnées ({withCoordinates.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {withCoordinates.map((company) => (
              <div key={company.id} className="bg-green-50 p-3 rounded border">
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-600">
                  {company.city} - {company.address || "Adresse inconnue"}
                </div>
                <div className="text-sm font-mono text-green-600">
                  Lat: {company.coordinates?.lat}, Lng:{" "}
                  {company.coordinates?.lng}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-red-700">
            ❌ Entreprises sans coordonnées ({withoutCoordinates.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {withoutCoordinates.map((company) => (
              <div key={company.id} className="bg-red-50 p-3 rounded border">
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-600">
                  {company.city} - {company.address || "Adresse inconnue"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
