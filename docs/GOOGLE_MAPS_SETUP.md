# 🗺️ Configuration Google Maps pour le géocodage précis

## 📋 Prérequis

1. **Compte Google Cloud Console**

   - Allez sur [console.cloud.google.com](https://console.cloud.google.com)
   - Créez un nouveau projet ou utilisez un existant

2. **Activer l'API Geocoding**

   - Dans la console, allez dans "APIs & Services" → "Library"
   - Recherchez "Geocoding API"
   - Cliquez sur "Enable"

3. **Créer une clé API**
   - Allez dans "APIs & Services" → "Credentials"
   - Cliquez sur "+ CREATE CREDENTIALS" → "API key"
   - Copiez la clé générée

## 💰 Coûts Google Maps Geocoding API

- **Gratuit :** 40,000 requêtes/mois
- **Payant :** $0.005 par requête au-delà
- **Très précis** pour les adresses françaises

## 🔧 Configuration

1. **Ajoutez à votre fichier `.env.local` :**

```bash
GOOGLE_MAPS_API_KEY=votre_clé_api_ici
```

2. **Exécutez le script de géocodage :**

```bash
npx tsx geocode-with-google.js
```

## 🎯 Avantages Google Maps vs Nominatim

| Aspect                  | Google Maps           | Nominatim (OSM)  |
| ----------------------- | --------------------- | ---------------- |
| **Précision**           | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐ Bonne     |
| **Adresses françaises** | ⭐⭐⭐⭐⭐ Parfaite   | ⭐⭐⭐ Moyenne   |
| **Couvertures**         | ⭐⭐⭐⭐⭐ Mondiale   | ⭐⭐⭐⭐ Bonne   |
| **Coût**                | 💰 Payant après 40k   | 🆓 Gratuit       |
| **Limites**             | ⚡ Quota élevé        | 🐌 Rate limiting |

## 🚀 Utilisation recommandée

Pour un projet en production avec des adresses françaises :

1. **Utilisez Google Maps** pour la précision
2. **Gardez Nominatim** comme fallback
3. **Cachez les résultats** pour éviter les requêtes répétées

## 📝 Code d'exemple

```javascript
import nodeGeocoder from "node-geocoder";

const geocoder = nodeGeocoder({
  provider: "google",
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  region: "FR",
  language: "fr",
});

// Géocodage précis
const results = await geocoder.geocode(
  "12 rue Chateauredon, Marseille, France"
);
console.log(results[0].latitude, results[0].longitude);
// Résultat: coordonnées exactes du bâtiment !
```

---

**🎯 Résultat attendu :** Votre entreprise de Marseille apparaîtra exactement au bon endroit sur la carte !
