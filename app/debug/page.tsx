"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DebugPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult("");

    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult("✅ " + data.message);
      } else {
        setResult("❌ Erreur: " + data.error);
      }
    } catch (error) {
      setResult("❌ Erreur réseau: " + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Debug - Seed Database
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          Cette page permet d&apos;initialiser la base de données avec les
          données de secteurs d&apos;activité et valeurs d&apos;entreprise.
        </p>

        <Button
          onClick={handleSeed}
          disabled={isSeeding}
          className="w-full mb-4"
        >
          {isSeeding ? "🌱 Seeding..." : "🌱 Lancer le seeding"}
        </Button>

        {/* Test de la couleur primaire */}
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">🎨 Test Couleur Primaire</h3>
          <div className="space-y-2">
            <div className="p-3 bg-primary text-primary-foreground rounded text-center">
              oklch(0.723 0.219 149.579)
            </div>
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Bouton test primaire
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Si c&apos;est bleu → problème de cache. Faites Ctrl+F5
          </p>
        </div>

        {result && (
          <div className="p-3 bg-gray-100 rounded text-sm whitespace-pre-line">
            {result}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>Une fois le seeding terminé, vous pouvez :</p>
          <ul className="mt-2 list-disc list-inside">
            <li>Aller sur /business/settings/profile</li>
            <li>Tester les modifications et sauvegarde</li>
            <li>Vérifier que les données persistent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
