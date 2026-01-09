// Script principal pour exécuter le géocodage
// Choisit automatiquement la meilleure méthode disponible

console.log("🗺️ Lancement du géocodage automatique...\n");

// Vérifier si Google Maps API key est configurée
const hasGoogleMaps =
  process.env.GOOGLE_MAPS_API_KEY &&
  process.env.GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

if (hasGoogleMaps) {
  console.log(
    "✅ Clé API Google Maps détectée - Utilisation du géocodage précis\n"
  );
  console.log("📍 Avantages:");
  console.log("   • Précision excellente pour les adresses françaises");
  console.log("   • Reconnait les noms de rue, codes postaux, etc.");
  console.log("   • 40,000 requêtes gratuites/mois\n");

  // Importer et exécuter le script Google Maps
  import("./geocode-with-google.js");
} else {
  console.log(
    "⚠️ Pas de clé API Google Maps - Utilisation de Nominatim (OpenStreetMap)\n"
  );
  console.log("📍 Nominatim est gratuit mais moins précis:");
  console.log("   • Peut ne pas trouver des adresses spécifiques");
  console.log("   • Moins de couverture en France");
  console.log("   • Rate limiting plus strict\n");
  console.log(
    "💡 Pour de meilleurs résultats, configurez GOOGLE_MAPS_API_KEY\n"
  );

  // Importer et exécuter le script Nominatim
  import("./geocode-companies-simple.js");
}
