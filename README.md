# Event organisation calendar

Application web pour planifier les bénévoles sur un événement : postes, créneaux de 30 minutes et grille partagée en temps réel.

## Fonctionnalités

- Création d’événements avec plage horaire (y compris après minuit)
- Gestion de l’équipe : bénévoles (couleur par personne) et postes avec **minimum** de personnes par créneau
- Grille planning : affectation par case, fermeture de créneaux « pas de bénévoles »
- Synchronisation automatique entre navigateurs (polling ~2,5 s)

## Prérequis

- [Node.js](https://nodejs.org/) 20+

## Installation

```bash
git clone git@github.com:inesbdl/event-organisation-calendar.git
cd event-organisation-calendar
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173). L’API est intégrée au serveur Vite (plugin dans `server/`).

Les données sont persistées dans `data/store.json` (fichier local, ignoré par Git).

## Production

```bash
npm run build
npm run preview
```

## Scripts

| Commande        | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Serveur de développement |
| `npm run build` | Build TypeScript + Vite  |
| `npm run preview` | Aperçu du build        |
| `npm run lint`  | ESLint                   |

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4, Lucide React
- Persistance JSON (`server/data-store.ts`, `server/api-handlers.ts`)

## Structure

```
├── public/          # Favicon, assets statiques
├── server/          # API et plugin Vite
├── src/             # Interface React
├── data/            # store.json (généré localement)
└── postcss.config.mjs
```

## Licence

Projet privé.
