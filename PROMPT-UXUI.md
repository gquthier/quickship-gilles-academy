# PROMPT UX/UI - Academy Platform Gilles Vaquier de Labaume

## Contexte
Client: Gilles Vaquier de Labaume
Projet: Plateforme de formation "Gestes essentiels avec un bébé"
Cible: Futurs et Jeunes Papas / Couples.
Objectif: Espace membre sécurisé avec accès illimité aux vidéos après paiement unique.

## Identité Visuelle (Cohérence avec Landing)
- Palette: #e292fe -> #61187c (Dégradés de violet).
- Ambiance: Dashboard épuré, focus sur la vidéo, navigation simple.
- Typographie: Moderne, lisible.

## Structure de la Plateforme (Pages à générer)
1. **Auth Interface**: Connexion / Inscription par email/password (utilisant Supabase Auth).
2. **Dashboard Membre**: Liste des modules de formation (vidéos).
3. **Lecteur Vidéo**: Page dédiée par module avec description et points clés.
4. **Checkout Flow**: Page de paiement Stripe Checkout intégrée.
5. **Success/Cancel pages**: Confirmation de paiement et activation des accès.

## Logique Fonctionnelle
- Protection de routes : Uniquement accessible si l'utilisateur est authentifié ET a payé (via metadata 'is_member' ou table 'subscriptions').
- Utilisation de Supabase (client-side & server-side) pour Auth et données.
- Integration Stripe : Redirection vers Stripe Checkout Session.
- Webhook Stripe : Pour mettre à jour le statut membre dans Supabase ou Stripe metadata.

## Directives Gemini pour le Code
Génère une structure Next.js App Router (14+) pour cette plateforme.
- Utilise Shadcn UI pour les composants de base (Card, Button, Dialog).
- Utilise Tailwind CSS avec le thème de dégradés violet.
- Met en place un layout avec sidebar pour la navigation entre les modules.
- Intègre un composant de lecteur vidéo (mock pour l'instant ou Iframe).
- Prépare le code pour l'interaction avec Stripe (API Route `api/checkout`).
