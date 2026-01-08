# Plateforme d'Engagement Solidaire

## 🎯 Vision du Projet

Une plateforme qui connecte les citoyens avec des associations locales (humanitaire, écologie, agriculture, seconde main) pour faciliter l'engagement solidaire. L'application centralise les opportunités de bénévolat, gamifie l'expérience avec un système de récompenses, et crée une communauté autour de l'action sociale et environnementale.

**Interface hybride** : Mix entre Instagram (feed visuel) et Twitter (actualités/good news) pour rendre l'engagement solidaire attractif et moderne.

---

## 💡 Propositions de Valeur

### Pour les Bénévoles

- Trouvez facilement des missions solidaires près de chez vous
- Rencontrez des gens engagés et partagez des valeurs communes
- Gagnez des avantages chez des partenaires locaux (points/crédits)
- Recevez une petite rémunération modeste quand c'est possible
- Suivez un feed inspirant de bonnes nouvelles et actions solidaires

### Pour les Associations

- Recrutez des bénévoles qualifiés et motivés
- Organisez vos événements facilement via la plateforme
- Gagnez en visibilité auprès d'une communauté engagée
- Gérez vos inscriptions et validez les participations
- Accédez à des statistiques sur votre impact

### Pour les Villes/Mairies

- Dynamisez l'engagement citoyen sur votre territoire
- Soutenez le tissu associatif local
- Mesurez l'impact environnemental et social des actions
- Valorisez votre politique de cohésion sociale

---

## ⭐ Fonctionnalités Principales

### Feed Social (Cœur de l'expérience)

- **Feed de good news** : Actualités positives, réussites d'actions, témoignages
- **Interface type Instagram/Twitter** : Posts visuels, likes, partages, commentaires
- **Stories d'événements** : Mises en avant des missions du jour
- **Profils associations** : Pages attractives avec historique d'actions

### Pour les Associations

#### Gestion de Profil

- Création de profil avec description, domaine d'action, contact
- Galerie photos/vidéos des actions passées
- Badges et certifications (partenaire mairie, etc.)

#### Gestion d'Événements

- Création de missions et événements (maraudes, actions écologiques, collectes, fundraising)
- Système de réservation avec gestion des places disponibles
- Validation de participation des bénévoles (QR code ou check-in)
- Attribution automatique des points/récompenses
- Statistiques détaillées (participants, impact, engagement)

### Pour les Bénévoles

#### Découverte & Engagement

- **Carte interactive** : Visualisation géolocalisée des événements et associations
- Filtres avancés : domaine, date, localisation, type d'action
- Calendrier personnel des missions
- Système d'abonnement aux associations favorites

#### Participation & Récompenses

- Réservation de places pour les missions/événements
- Notifications push (nouveaux événements, rappels, validations)
- **Système de points gamifié** : Accumulation de crédits à chaque mission
- Conversion des points chez partenaires locaux (commerces, services)
- Petite rémunération en cash quand budget disponible (subventions)
- Historique des missions accomplies avec badges

### Fonctionnalités Transverses

#### Carte & Géolocalisation

- Carte interactive avec clusters d'événements
- Filtres en temps réel sur la carte
- Vue par associations ou par événements
- Calcul de distance et itinéraire

#### Notifications & Communication

- Push notifications (nouveaux événements, rappels 24h avant, validation participation)
- Système de messagerie entre associations et bénévoles
- Alertes personnalisées selon préférences

#### Module Collecte (Phase 2)

- Dépôt d'annonces pour dons (habits, meubles, objets)
- Géolocalisation des points de collecte
- Mise en relation donateurs/associations
- Suivi des collectes réalisées

---

## 🚀 Stratégie de Déploiement

### Phase 1 - MVP Marseille (1-2 mois)

**Objectif** : Version complète fonctionnelle pour démarcher les mairies et tester avec les associations

#### Développement

- **Web app responsive** (Next.js + shadcn/ui) : Interface moderne et mobile-friendly
- **App mobile** (React Native) : iOS & Android natifs
- **All in** : Les deux plateformes développées en parallèle pour une expérience complète

#### Features MVP

- Authentification (bénévoles + associations)
- Profils complets (utilisateurs et associations)
- Création/gestion d'événements
- Système de réservation
- Carte interactive avec géolocalisation
- Notifications push
- Feed social basique
- Système de points (sans conversion encore)

#### Go-to-Market

- **Focus Marseille** : Concentration sur une ville test
- **Partenariat mairie** : PRIORITÉ ABSOLUE pour la survie du projet
  - Subventions pour rémunération modeste des bénévoles
  - Financement de repas/boissons lors des missions
  - Validation institutionnelle
- Test avec 5-10 associations pilotes
- Recrutement de 100 premiers bénévoles

### Phase 2 - Expansion (3-6 mois après MVP)

#### Nouvelles Villes

- Déploiement progressif : Lyon, Paris, Bordeaux, Toulouse, Nice
- Adaptation du modèle selon feedback Marseille
- Partenariats mairies dans chaque nouvelle ville

#### Nouvelles Features

- **Système de récompenses actif** : Conversion points → avantages partenaires
- **Partenariats commerciaux** : Restaurants, cinémas, commerces locaux
- **Module collecte** : Don d'objets et seconde main
- **Analytics avancés** : Impact environnemental, tableaux de bord
- **Gamification poussée** : Classements, défis mensuels, badges spéciaux

#### Monétisation

- Modèle freemium pour associations (stats avancées, mise en avant)
- Commission sur événements payants (bars éphémères, fundraising)
- Partenariats sponsors locaux

---

## 🛠️ Stack Technique

### Frontend

#### Web App

- **Framework** : Next.js 14+ (App Router)
- **UI** : shadcn/ui + Tailwind CSS
- **Language** : TypeScript
- **State** : Zustand ou React Context
- **Maps** : Leaflet React

#### Mobile App

- **Framework** : React Native / Expo
- **UI** : React Native components + styled-components
- **Navigation** : Expo Router
- **Partage de code** : 30-40% logique métier réutilisée du web

### Backend & Infrastructure

#### Base de Données

- **PostgreSQL** : Supabase (Frankfurt, EU - RGPD compliant)
- Hébergement français possible via Scalingo si requis par mairies
- **ORM** : Prisma (intégré avec Supabase)

#### Services

- **Auth** : Supabase Auth (magic links, OAuth)
- **Storage** : Supabase Storage (photos événements, profils)
- **API** : Next.js API Routes + Supabase REST API
- **Realtime** : Supabase Realtime (notifications, feed)

#### Hosting & CI/CD

- **Frontend Web** : Vercel (déploiement automatique)
- **Mobile** : Expo EAS (build iOS/Android)
- **Database** : Supabase (managed)

#### External Services

- **Notifications Push** : OneSignal ou Firebase Cloud Messaging
- **Emails** : Resend (transactionnels)
- **Maps** : Leaflet + OpenStreetMap (gratuit)
- **Analytics** : Vercel Analytics + Supabase Analytics

### Pourquoi cette Stack ?

✅ **Rapidité** : MVP complet en 1-2 mois
✅ **Coûts** : Tiers gratuits pour démarrer (~0€/mois)
✅ **Scalabilité** : Architecture prête pour des milliers d'utilisateurs
✅ **Modern** : Stack 2025, excellente DX
✅ **Mobile-first** : Responsive web + native mobile
✅ **Maintenance** : TypeScript = moins de bugs
✅ **RGPD** : Hébergement EU possible

---

## 💰 Modèle Économique

### Court Terme (Survie du projet)

**Objectif** : Financer les petites rémunérations et frais de fonctionnement

- **Subventions municipales** : Budget alloué par mairies pour rémunération bénévoles
- **Subventions régionales** : Fonds dédiés à l'engagement citoyen
- **Partenariats locaux** : Commerces qui offrent avantages contre visibilité

### Long Terme (Auto-financement)

**Objectif** : Système qui se finance pour se pérenniser

- **Freemium associations** : Fonctionnalités premium (stats avancées, mise en avant, multi-événements)
- **Commission événements payants** : 5-10% sur bars éphémères, ventes solidaires
- **Partenariats entreprises** : Sponsoring pour visibilité dans l'app
- **Subventions pérennes** : Convention pluriannuelle avec collectivités

### Principe de Récompense

**Philosophie** : Petit boost motivationnel, pas un salaire

- **Modeste et ciblé** : 5-10€ par mission de 3-4h (quand budget dispo)
- **Réintroduit dans l'économie locale** : Crédits utilisables chez partenaires
- **Pas systématique** : Certains événements non rémunérés (pur bénévolat)
- **Transparent** : Bénévoles savent avant de s'inscrire si rémunération ou non

---

## 📊 Métriques de Succès

### Phase MVP (3 mois)

- 10 associations actives sur Marseille
- 200 bénévoles inscrits
- 50 événements organisés
- 1 partenariat mairie signé
- Taux de réservation : 70%+
- NPS (satisfaction) : 8+/10

### Phase Expansion (12 mois)

- 5 villes actives
- 50 associations
- 2000 bénévoles
- 500 événements/mois
- 20 partenaires commerciaux
- Break-even financier

---

## 🎯 Prochaines Étapes

### Weekend 1 (Setup)

- [ ] Init projet Next.js + Supabase
- [ ] Setup shadcn/ui
- [ ] Architecture base de données
- [ ] Auth fonctionnelle

### Semaine 1-2 (Core Features)

- [ ] CRUD événements
- [ ] Système réservation
- [ ] Carte interactive
- [ ] Profils associations/bénévoles

### Semaine 3-4 (Polish & Mobile)

- [ ] Feed social
- [ ] Notifications
- [ ] App mobile React Native
- [ ] Design responsive final

### Mois 2 (Déploiement)

- [ ] Tests utilisateurs
- [ ] Démarche mairie Marseille
- [ ] Onboarding 5 associations pilotes
- [ ] Launch MVP ! 🚀

---

## 💭 Notes Importantes

### Différenciateurs Clés

- **Interface moderne** : Pas un site web d'asso des années 2000
- **Feed social** : Rend l'engagement cool et inspirant
- **Gamification** : Points, badges, récompenses
- **Mobile-first** : Génération smartphone native
- **Récompenses réelles** : Pas que du bénévolat pur

### Risques & Mitigation

**Risque** : Pas de subvention mairie → Pas de rémunération → Pas d'adoption
**Mitigation** : Partenariat mairie = PRIORITÉ #1. Pitch sur impact social mesurable

**Risque** : Complexité paiements/cash
**Mitigation** : Phase 1 = points virtuels. Cash ajouté en Phase 2 si budget validé

**Risque** : Associations pas tech-savvy
**Mitigation** : Interface ultra-simple + accompagnement onboarding

### Vision Long Terme

> "Si ça scale, ça veut dire que des milliers de personnes auront fait des actions solidaires. Même sans rentabilité, c'est une victoire."

Le but n'est pas de devenir riche, mais de créer un outil qui facilite l'engagement et crée du lien social. Si ça aide la société, c'est déjà un succès.

---

**Dernière mise à jour** : Janvier 2026  
**Statut** : En développement - Phase MVP  
**Ville pilote** : Marseille 🌊
