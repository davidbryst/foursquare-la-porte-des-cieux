# Approches d'enregistrement des présences

Scénarios utilisables avec l'app existante + 4 tablettes appartenant à l'église.

---

## Approche 1 — Code projecteur (implémentée)

Le code est affiché sur le vidéoprojecteur de la salle.
Chaque membre saisit le code depuis **son propre téléphone** pour valider sa présence.

**Route existante** : `/display` (page vidéoprojecteur) + `/` (formulaire membre)

- Code à 6 chiffres rotatif généré par l'admin
- Expire automatiquement après la durée de séance choisie (1 à 4 h)
- Countdown en temps réel sur le vidéoprojecteur (couleurs : vert → jaune → rouge)
- Nécessite que le membre ait son téléphone avec accès au réseau WiFi de l'église
- Aucune tablette requise — les 4 tablettes peuvent servir à autre chose

**Avantages** : Aucun huissier requis, rapide, scalable
**Inconvénients** : Exclut les membres sans smartphone

---

## Approche 2 — Bornes d'accueil (self-service)

Les 4 tablettes sont posées à l'entrée de l'église sur des présentoirs.
Chaque membre arrive, trouve son nom dans l'app et tape "Présent" lui-même.

**Route à créer** : `/kiosk`

- Interface tactile avec gros boutons, optimisée pour l'entrée rapide
- Recherche par 2+ lettres du nom ou prénom
- Après confirmation, retour automatique à l'écran d'accueil (délai 5 secondes)
- Tablettes en mode plein écran verrouillé sur cette page
- Pas d'authentification côté appareil — l'accès physique à la tablette est le contrôle
- Compatible avec les membres sans smartphone

**Avantages** : Autonomie membre, pas de téléphone personnel requis
**Inconvénients** : File d'attente possible à l'entrée, tablettes immobilisées

---

## Approche 3 — Pointage par secteur (appareils d'huissiers)

Chaque huissier prend une tablette et parcourt ses rangées.
Il cherche chaque membre et le marque présent sur l'app.

**Route à créer** : `/mark`

- Interface épurée : champ de recherche + gros bouton "Marquer présent"
- Filtre par catégorie (Hommes / Femmes / Jeunes / Enfants)
  → Chaque tablette couvre une section de la salle
- Pas d'authentification requise (tablettes dans l'enceinte de l'église)
- Fonctionne en parallèle : 4 huissiers marquent simultanément

**Avantages** : Couvre les membres sans smartphone, contrôle humain
**Inconvénients** : Nécessite 4 huissiers disponibles, saisie manuelle

---

## Approche 4 — Liste d'appel (roll call)

La séance démarre. Un ou plusieurs huissiers voient la **liste complète** des membres et cochent au fur et à mesure des arrivées.

**Route à créer** : `/rollcall` (accessible avec le code de séance)

- Tableau compact de tous les membres avec toggle Présent / Absent
- Filtre par catégorie pour répartir le travail entre tablettes
- Enregistrement en temps réel (un appel API par toggle, sans rechargement)
- Résumé dynamique en bas : "32 / 45 présents"
- Peut fonctionner après le culte (appel fait de mémoire ou par liste papier)

**Avantages** : Vue d'ensemble complète, bonne pour les petites assemblées
**Inconvénients** : Laborieux pour les grandes assemblées, risque d'oublis

---

## Comparaison rapide

| Approche | Autonomie membre | Rôle huissier | Smartphone requis | Effort dev |
|---|---|---|---|---|
| **Code projecteur** *(actuel)* | Oui | Aucun | Oui | Déjà fait |
| **Bornes d'accueil** | Oui | Surveillance | Non | Moyen |
| **Pointage par secteur** | Non | Marque les autres | Non | Faible |
| **Liste d'appel** | Non | Coche une liste | Non | Moyen |

---

## Combinaisons recommandées

- **Petite assemblée (< 100 personnes)** : Code projecteur + liste d'appel en backup
- **Grande assemblée (> 100 personnes)** : Bornes d'accueil + pointage par secteur pour les retardataires
- **Assemblée mixte (générations variées)** : Bornes d'accueil (entrée) + code projecteur (depuis son téléphone)
