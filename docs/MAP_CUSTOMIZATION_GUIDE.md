# Guide de Personnalisation des Cartes React Leaflet

## Vue d'ensemble

React Leaflet offre une **modularité exceptionnelle** pour créer des cartes interactives personnalisées. Votre composant actuel utilise déjà quelques personnalisations, mais il existe de nombreuses possibilités d'extension.

## 🎨 Fournisseurs de Tuiles (Tile Providers)

### Styles Disponibles

| Style         | Fournisseur   | Description                    | URL                                                                                             |
| ------------- | ------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Défaut**    | OpenStreetMap | Style classique gratuit        | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`                                            |
| **Sombre**    | CartoDB       | Parfait pour thème sombre      | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`                                 |
| **Minimal**   | Stadia Maps   | Style épuré et moderne         | `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png`                          |
| **Satellite** | ESRI          | Images satellite haute qualité | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |
| **Aquarelle** | Stamen        | Style artistique unique        | `https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}`                        |

### Avantages de chaque style :

- **OpenStreetMap** : Gratuit, détaillé, communautaire
- **CartoDB Dark** : Idéal pour applications modernes
- **Stadia Minimal** : Design épuré et professionnel
- **ESRI Satellite** : Images réelles pour contexte géographique
- **Stamen Watercolor** : Original et artistique

## 🏷️ Marqueurs Personnalisés

### Types de Marqueurs Disponibles

#### 1. **Marqueurs Colorés** (Simple)

```tsx
const createColoredMarker = (color: string) =>
  new DivIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
```

#### 2. **Marqueurs Numérotés**

```tsx
const createNumberedMarker = (number: number) =>
  new DivIcon({
    html: `<div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
```

#### 3. **Marqueurs avec Icônes**

```tsx
const createIconMarker = (iconHtml: string) =>
  new DivIcon({
    html: `<div style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
```

#### 4. **Marqueurs Clusters** (avec `react-leaflet-cluster`)

```tsx
import MarkerClusterGroup from "react-leaflet-cluster";

<MarkerClusterGroup>
  {markers.map((marker) => (
    <Marker key={marker.id} position={marker.position} />
  ))}
</MarkerClusterGroup>;
```

## 💬 Popups Personnalisés

### Styles de Popup

#### **Popup Compact**

- Design minimaliste
- Idéal pour écrans mobiles
- Contenu essentiel uniquement

#### **Popup Détaillé**

- Informations complètes
- Boutons d'action
- Design moderne avec cartes

### Fonctionnalités Avancées :

- **Popups ancrés** : Se positionnent automatiquement
- **Contenu HTML personnalisé** : Intégration complète avec React
- **Animations** : Transitions fluides
- **Responsive** : S'adaptent à la taille d'écran

## 🎛️ Contrôles et Fonctionnalités Avancées

### Contrôles Disponibles

#### **Contrôles de Navigation**

```tsx
<MapContainer zoomControl={true} attributionControl={true}>
  {/* Contrôles inclus par défaut */}
</MapContainer>
```

#### **Contrôles Personnalisés**

- **Localisation** : Bouton "Me localiser"
- **Plein écran** : Mode fullscreen
- **Échelle** : Affichage de l'échelle
- **Layers** : Changement de couches

### Couches Supplémentaires

#### **Cercles et Zones**

```tsx
<Circle
  center={[48.8566, 2.3522]}
  radius={5000}
  pathOptions={{
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.1,
  }}
/>
```

#### **Polygones**

```tsx
<Polygon
  positions={coordinates}
  pathOptions={{
    color: "green",
    fillColor: "green",
    fillOpacity: 0.3,
  }}
/>
```

#### **Heatmaps** (avec `react-leaflet-heatmap-layer`)

```tsx
import HeatmapLayer from "react-leaflet-heatmap-layer";

<HeatmapLayer
  points={heatmapData}
  longitudeExtractor={(m) => m.lng}
  latitudeExtractor={(m) => m.lat}
  intensityExtractor={(m) => m.intensity}
/>;
```

## 🎨 Thèmes et Styles CSS

### Variables CSS Personnalisables

```css
/* Popups */
.leaflet-popup-content-wrapper {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Contrôles */
.leaflet-control-container .leaflet-control {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Marqueurs */
.custom-marker {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
```

## 📱 Responsive Design

### Breakpoints Recommandés

```tsx
// Tailles de carte adaptatives
const getMapHeight = () => {
  if (window.innerWidth < 640) return "300px"; // Mobile
  if (window.innerWidth < 1024) return "400px"; // Tablet
  return "500px"; // Desktop
};
```

### Optimisations Mobiles

- **Marqueurs tactiles** : Tailles minimales pour le toucher
- **Popups adaptés** : Contenu simplifié sur mobile
- **Contrôles optimisés** : Positionnement stratégique

## 🔧 Intégration et Configuration

### Props Modulables

```tsx
interface MapComponentProps {
  // Style de base
  variant?: "default" | "dark" | "minimal" | "satellite" | "watercolor";

  // Personnalisation des marqueurs
  markerStyle?: "default" | "colored" | "numbered" | "icon";
  markerColor?: string;
  showClusters?: boolean;

  // Personnalisation des popups
  popupStyle?: "compact" | "detailed";
  showImages?: boolean;

  // Fonctionnalités
  showHeatmap?: boolean;
  enableFullscreen?: boolean;
  showScale?: boolean;

  // Géolocalisation
  enableLocation?: boolean;
  centerOnUser?: boolean;
}
```

### Architecture Modulaire

```
MapComponent/
├── BaseMap (container principal)
├── TileLayerProvider (fournisseur de tuiles)
├── MarkerLayer (marqueurs personnalisables)
├── PopupLayer (popups modales)
├── ControlLayer (contrôles supplémentaires)
└── Utils (helpers et constantes)
```

## 🚀 Performance et Optimisation

### Optimisations Recommandées

1. **Lazy Loading** : Charger les composants à la demande
2. **Clustering** : Grouper les marqueurs proches
3. **Virtualisation** : Pour grandes quantités de données
4. **Caching** : Mémoriser les tuiles
5. **SSR Compatibility** : Gestion du rendu côté serveur

### Exemple d'Optimisation

```tsx
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

## 🎯 Cas d'Usage Avancés

### Cartes Multi-Layers

- **Couches superposées** : Satellite + données vectorielles
- **Contrôles de visibilité** : Afficher/masquer des couches
- **Légende interactive** : Explication des symboles

### Cartes Thématiques

- **Heatmaps** : Densité de données
- **Choropleth** : Couleur par région
- **Flow maps** : Déplacements et connexions

### Intégrations Externes

- **Données temps réel** : Mise à jour automatique
- **APIs externes** : Intégration de services
- **WebSockets** : Synchronisation multi-utilisateurs

## 📚 Ressources Utiles

### Bibliothèques Complémentaires

- `react-leaflet-cluster` : Clustering de marqueurs
- `react-leaflet-heatmap-layer` : Cartes de chaleur
- `leaflet-routing-machine` : Calcul d'itinéraires
- `leaflet-draw` : Outils de dessin

### Documentation

- [React Leaflet Docs](https://react-leaflet.js.org/)
- [Leaflet Docs](https://leafletjs.com/reference.html)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)

## 🌓 Contrôle de Thème Dynamique

### Basculement Thème Sombre/Clair

Votre carte inclut maintenant un contrôle intégré pour basculer entre les thèmes :

```tsx
// État pour contrôler le thème
const [mapTheme, setMapTheme] = useState<"dark" | "default">("dark");

// Fonction pour basculer
const toggleMapTheme = () => {
  setMapTheme((prev) => (prev === "dark" ? "default" : "dark"));
};

// Utilisation dans le composant
<MapVariants
  companies={companies}
  variant={mapTheme} // Thème contrôlé dynamiquement
  markerStyle="colored"
  popupStyle="detailed"
/>;
```

### Bouton de Contrôle dans l'Interface

Un bouton élégant permet aux utilisateurs de basculer entre les modes :

- **🌙 Mode sombre** : Carte sombre (CartoDB) avec marqueurs colorés
- **☀️ Mode clair** : Carte classique (OpenStreetMap) avec marqueurs par défaut

### Avantages du Mode Sombre

- **Confort visuel** : Réduit la fatigue oculaire
- **Design moderne** : Interface élégante et professionnelle
- **Accessibilité** : Meilleure lisibilité dans différents environnements
- **Batterie** : Consomme moins d'énergie sur les écrans OLED

Cette modularité fait de React Leaflet un choix parfait pour des cartes hautement personnalisables et maintenables ! 🌍✨
