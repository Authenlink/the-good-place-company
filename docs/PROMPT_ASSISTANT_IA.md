# Prompt pour Assistant IA - Inscription avec Choix de Créneau et Mission

## Contexte

Nous avons implémenté un système de planning pour les événements. Les associations peuvent maintenant créer des créneaux horaires avec plusieurs types de missions/postes (ex: Accueil, Distribution, Logistique, etc.).

**Ce qui existe déjà** :

- Les associations peuvent créer des créneaux avec plusieurs missions
- L'API retourne les créneaux avec leurs missions disponibles
- Le composant `EventSlotSelector` affiche les créneaux et leurs missions
- L'API d'inscription accepte déjà `slotId`

**Ce qui manque** :

- Permettre aux utilisateurs de choisir **à la fois** un créneau ET une mission lors de l'inscription
- Compter les disponibilités par mission (pas seulement par créneau)
- Stocker la mission choisie dans la base de données

## Tâche principale

Modifier le processus d'inscription pour qu'un utilisateur puisse :

1. Sélectionner un créneau horaire (déjà fait)
2. **Sélectionner une mission/post parmi celles disponibles pour ce créneau** (à faire)
3. S'inscrire avec le créneau ET la mission choisis

## Modifications nécessaires

### 1. Base de données

Ajouter une colonne `mission_type` à la table `event_slot_participants` pour stocker la mission choisie :

```sql
ALTER TABLE "event_slot_participants"
ADD COLUMN IF NOT EXISTS "mission_type" text;

CREATE INDEX IF NOT EXISTS "event_slot_participants_mission_type_idx"
ON "event_slot_participants" ("slot_id", "mission_type");
```

### 2. API - Modifier l'inscription

**Fichier** : `app/api/events/[eventId]/participants/route.ts`

**Modifications** :

- Accepter `missionType` dans le body de la requête POST (en plus de `slotId`)
- Si `slotId` est fourni, `missionType` devient obligatoire
- Vérifier que la mission existe dans le créneau sélectionné (vérifier dans `slot.missions`)
- Compter les participants déjà inscrits pour cette mission spécifique dans ce créneau
- Vérifier que `mission.maxParticipants` n'est pas dépassé
- Enregistrer la mission dans `event_slot_participants` lors de la création

**Structure de la requête** :

```json
{
  "slotId": 123,
  "missionType": "accueil"
}
```

### 3. Composant EventSlotSelector

**Fichier** : `components/event-slot-selector.tsx`

**Modifications** :

- Ajouter un état pour la mission sélectionnée : `selectedMissionType`
- Après qu'un utilisateur clique sur un créneau, afficher les missions disponibles pour ce créneau
- Créer une interface en 2 étapes :
  - **Étape 1** : Sélection du créneau (déjà fait)
  - **Étape 2** : Sélection de la mission (à ajouter)
    - Afficher les missions du créneau sélectionné
    - Pour chaque mission, afficher :
      - Le nom de la mission
      - Le nombre de places disponibles (maxParticipants - participants déjà inscrits pour cette mission)
      - Un indicateur "Complet" si plus de place
    - Permettre la sélection d'une mission
- Modifier `onSelect` pour accepter `(slotId: number, missionType?: string)`
- Désactiver le bouton "S'inscrire" si un créneau est sélectionné mais pas de mission

**Interface proposée** :

- Quand un créneau est sélectionné, afficher une section "Choisissez votre mission" en dessous
- Liste des missions avec badges de disponibilité
- Sélection visuelle de la mission choisie

### 4. Page d'inscription

**Fichier** : `app/events/[eventId]/page.tsx`

**Modifications** :

- Ajouter un état `selectedMissionType` pour stocker la mission choisie
- Modifier `handleRegister` pour envoyer `{ slotId: selectedSlotId, missionType: selectedMissionType }`
- Réinitialiser `selectedMissionType` après inscription réussie
- Afficher un message de confirmation avec le créneau ET la mission

### 5. API GET - Compter les participants par mission

**Fichier** : `app/api/events/[eventId]/route.ts` ou créer un nouvel endpoint

**Modifications** :

- Pour chaque mission dans chaque créneau, compter les participants inscrits pour cette mission
- Retourner `availableSpots` par mission, pas seulement par créneau

**Structure de données à retourner** :

```typescript
{
  slots: [{
    id: number;
    startTime: string;
    endTime: string;
    missions: [{
      type: string;
      maxParticipants: number;
      registeredCount: number; // Nombre d'inscrits pour cette mission
      availableSpots: number; // Places restantes pour cette mission
    }]
  }]
}
```

## Contraintes importantes

1. **Validation** : Un utilisateur ne peut s'inscrire que si :
   - Le créneau a de la place ET
   - La mission choisie a de la place

2. **Obligatoire** : Si un événement a un planning, l'utilisateur DOIT choisir un créneau ET une mission

3. **Compatibilité** : Gérer les créneaux sans missions (ancien format) - dans ce cas, ne pas demander de mission

4. **UX** : Le processus doit être intuitif :
   - Sélection du créneau → Affichage des missions → Sélection de la mission → Inscription

## Exemple de flux utilisateur

1. Utilisateur arrive sur la page événement avec planning
2. Voit la liste des créneaux disponibles
3. Clique sur un créneau (ex: "10:00 - 11:00")
4. **NOUVEAU** : Voit apparaître les missions disponibles :
   - Accueil (3 places disponibles)
   - Distribution (5 places disponibles)
   - Logistique (Complet)
5. Clique sur "Accueil"
6. Clique sur "S'inscrire"
7. Confirmation : "Vous êtes inscrit au créneau 10:00-11:00 pour la mission Accueil"

## Fichiers à modifier (ordre recommandé)

1. Migration SQL : Ajouter `mission_type` à `event_slot_participants`
2. `app/api/events/[eventId]/participants/route.ts` : Accepter et valider `missionType`
3. `app/api/events/[eventId]/route.ts` : Compter les participants par mission
4. `components/event-slot-selector.tsx` : Ajouter sélection de mission
5. `app/events/[eventId]/page.tsx` : Gérer l'état et l'envoi de `missionType`

## Types TypeScript à utiliser

```typescript
// Mission dans un slot
interface Mission {
  type: MissionType; // "accueil" | "distribution" | etc.
  description?: string;
  maxParticipants: number;
}

// Slot avec missions et disponibilités
interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  missions: Array<
    Mission & {
      registeredCount: number;
      availableSpots: number;
    }
  >;
  // ... autres champs
}
```

## Points de vigilance

- Vérifier que la mission existe dans le créneau avant d'accepter l'inscription
- Compter correctement les participants par mission (requête SQL avec GROUP BY)
- Gérer les cas où une mission est complète mais le créneau a encore de la place
- Afficher clairement les disponibilités par mission dans l'UI
- S'assurer que le processus est responsive et fonctionne sur mobile
