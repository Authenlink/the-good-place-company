# Système de Planning - Inscription Utilisateur avec Choix de Créneau et Mission

## Contexte

Nous avons mis en place un système de planning pour les événements qui permet aux associations de créer des créneaux horaires avec plusieurs types de missions/postes. Maintenant, il faut adapter l'interface utilisateur pour que lors de l'inscription à un événement, les utilisateurs puissent :

1. **Choisir un créneau horaire** (si l'événement a un planning activé)
2. **Choisir un type de mission/post** parmi ceux disponibles pour ce créneau

## Ce qui a déjà été fait

### Base de données

- **Table `event_slots`** : Stocke les créneaux horaires avec :
  - `start_time` et `end_time` : Plage horaire du créneau
  - `max_participants` : Nombre maximum total de participants
  - `missions` : JSONB array contenant les missions disponibles pour ce créneau
    ```typescript
    missions: Array<{
      type: MissionType; // "accueil", "distribution", "logistique", etc.
      description?: string; // Si type = "autre"
      maxParticipants: number; // Nombre de personnes nécessaires pour cette mission
    }>;
    ```

- **Table `event_slot_participants`** : Lie les participants aux créneaux
  - `slot_id` : Référence au créneau
  - `participant_id` : Référence à l'inscription (event_participants)
  - `prefilled_name` : Pour les membres non-inscrits sur l'app

- **Table `event_participants`** : Modifiée pour inclure `slot_id`

### API Backend

- **GET `/api/events/[eventId]`** : Retourne l'événement avec :
  - `slots` : Array des créneaux avec leurs missions et disponibilités
  - `hasPlanning` : Boolean indiquant si l'événement a un planning

- **POST `/api/events/[eventId]/participants`** : Accepte déjà `slot_id` dans le body
  - Il faut maintenant aussi accepter `missionType` pour enregistrer quelle mission l'utilisateur a choisie

### Composants UI existants

- **`EventSlotSelector`** (`components/event-slot-selector.tsx`) : Affiche les créneaux disponibles
  - Affiche déjà les missions disponibles pour chaque créneau
  - Permet de sélectionner un créneau
  - **À modifier** : Ajouter la sélection de la mission après le choix du créneau

### Types de missions disponibles

```typescript
MISSION_TYPES = {
  accueil: "Accueil",
  distribution: "Distribution",
  logistique: "Logistique",
  animation: "Animation",
  communication: "Communication",
  securite: "Sécurité",
  autre: "Autre",
};
```

## Ce qui reste à faire

### 1. Modifier l'API d'inscription

**Fichier** : `app/api/events/[eventId]/participants/route.ts`

**Modifications nécessaires** :

- Accepter `missionType` dans le body de la requête POST
- Vérifier que la mission choisie existe dans le créneau sélectionné
- Vérifier que la mission a encore de la place (compter les participants déjà inscrits pour cette mission spécifique)
- Enregistrer la mission choisie dans `event_slot_participants` (peut nécessiter une nouvelle colonne ou utiliser un champ JSONB)

**Structure de la requête attendue** :

```json
{
  "slotId": 123,
  "missionType": "accueil"
}
```

### 2. Modifier le composant EventSlotSelector

**Fichier** : `components/event-slot-selector.tsx`

**Modifications nécessaires** :

- Après qu'un utilisateur clique sur un créneau, afficher les missions disponibles pour ce créneau
- Permettre à l'utilisateur de choisir une mission parmi celles disponibles
- Afficher le nombre de places disponibles pour chaque mission
- Envoyer à la fois `slotId` et `missionType` lors de l'inscription

**Interface proposée** :

- Étape 1 : Sélection du créneau (déjà fait)
- Étape 2 : Sélection de la mission (à ajouter)
  - Afficher les missions disponibles pour le créneau sélectionné
  - Afficher les places restantes pour chaque mission
  - Permettre la sélection d'une mission

### 3. Modifier la page d'inscription

**Fichier** : `app/events/[eventId]/page.tsx`

**Modifications nécessaires** :

- Gérer l'état de sélection de la mission en plus du créneau
- Modifier `handleRegister` pour envoyer `missionType` avec `slotId`
- Afficher un message de confirmation avec le créneau ET la mission choisis

### 4. Gestion des disponibilités par mission

**Important** : Il faut compter les participants par mission, pas seulement par créneau.

**Logique à implémenter** :

- Pour chaque mission dans un créneau, compter combien de participants sont déjà inscrits pour cette mission spécifique
- Vérifier que `mission.maxParticipants` n'est pas dépassé
- Afficher "Complet" si une mission n'a plus de place, même si le créneau a encore de la place

### 5. Stockage de la mission choisie

**Options** :

**Option A** : Ajouter une colonne `mission_type` à `event_slot_participants`

```sql
ALTER TABLE "event_slot_participants"
ADD COLUMN "mission_type" text;
```

**Option B** : Utiliser un champ JSONB pour stocker plus d'infos

```sql
ALTER TABLE "event_slot_participants"
ADD COLUMN "mission_data" jsonb;
```

**Recommandation** : Option A (plus simple et suffisant pour l'instant)

## Structure des données

### Slot avec missions (exemple)

```json
{
  "id": 1,
  "startTime": "2026-01-30T10:00:00Z",
  "endTime": "2026-01-30T11:00:00Z",
  "maxParticipants": 20,
  "missions": [
    {
      "type": "accueil",
      "maxParticipants": 5
    },
    {
      "type": "distribution",
      "maxParticipants": 10
    },
    {
      "type": "logistique",
      "maxParticipants": 5
    }
  ],
  "registeredCount": 8,
  "prefilledCount": 2,
  "totalCount": 10,
  "availableSpots": 10
}
```

### Données à envoyer lors de l'inscription

```json
{
  "slotId": 1,
  "missionType": "accueil"
}
```

## Flux utilisateur attendu

1. L'utilisateur arrive sur la page de l'événement
2. Si l'événement a un planning (`hasPlanning === true`) :
   - Afficher `EventSlotSelector` avec les créneaux disponibles
   - L'utilisateur clique sur un créneau
   - **NOUVEAU** : Afficher les missions disponibles pour ce créneau
   - L'utilisateur sélectionne une mission
   - L'utilisateur clique sur "S'inscrire"
   - Envoyer `{ slotId, missionType }` à l'API
3. Si pas de planning : Comportement actuel (inscription directe)

## Points d'attention

1. **Validation** : Vérifier que la mission choisie existe bien dans le créneau sélectionné
2. **Disponibilité** : Vérifier les places disponibles par mission, pas seulement par créneau
3. **UX** : Rendre le processus en 2 étapes (créneau → mission) fluide et intuitif
4. **Affichage** : Montrer clairement les places disponibles pour chaque mission
5. **Compatibilité** : Gérer les créneaux sans missions (ancien format) ou avec une seule mission

## Fichiers à modifier

1. `app/api/events/[eventId]/participants/route.ts` - Accepter missionType
2. `components/event-slot-selector.tsx` - Ajouter sélection de mission
3. `app/events/[eventId]/page.tsx` - Gérer l'état de sélection de mission
4. Migration SQL - Ajouter colonne mission_type à event_slot_participants (si Option A)

## Migration SQL nécessaire

```sql
-- Ajouter la colonne mission_type à event_slot_participants
ALTER TABLE "event_slot_participants"
ADD COLUMN IF NOT EXISTS "mission_type" text;

-- Index pour améliorer les requêtes
CREATE INDEX IF NOT EXISTS "event_slot_participants_mission_type_idx"
ON "event_slot_participants" ("slot_id", "mission_type");
```

## Exemple de réponse API attendue après inscription

```json
{
  "id": 456,
  "eventId": 123,
  "userId": 789,
  "status": "confirmed",
  "slotId": 1,
  "message": "Inscription confirmée - Créneau: 10:00-11:00, Mission: Accueil"
}
```

## Questions à résoudre

1. Un utilisateur peut-il s'inscrire à plusieurs missions dans le même créneau ? (Probablement non, mais à clarifier)
2. Que se passe-t-il si un utilisateur choisit un créneau mais aucune mission n'a de place ? (Afficher un message d'erreur)
3. Faut-il permettre de changer de mission après inscription ? (À décider)
