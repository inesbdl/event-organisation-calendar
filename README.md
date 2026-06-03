# Event organisation calendar

Application web pour planifier les bénévoles sur un événement : postes, créneaux de 30 minutes et grille partagée en temps réel.

## Fonctionnalités

- Création d’événements avec plage horaire (y compris après minuit)
- Gestion de l’équipe : bénévoles (couleur par personne) et postes avec **minimum** de personnes par créneau
- Grille planning : affectation par case, fermeture de créneaux « pas de bénévoles »
- Synchronisation automatique entre navigateurs (polling ~2,5 s)

## Prérequis

- [Node.js](https://nodejs.org/) 22+ (SQLite via `node:sqlite`)
- [PM2](https://pm2.keymetrics.io/) en global pour la prod : `npm install -g pm2`

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

Les données sont persistées dans **`data/planning.db`** (SQLite, ignoré par Git). Au premier lancement, un ancien `data/store.json` est importé automatiquement s’il existe.

## Production

```bash
npm run build
npm run start
```

Le serveur écoute par défaut sur [http://localhost:4173](http://localhost:4173) (`PORT` et `HOST` configurables).

## PM2

Installer [PM2](https://pm2.keymetrics.io/) (`npm install -g pm2`), puis :

```bash
npm run pm2:start    # build + démarrage
npm run pm2:logs     # journaux
npm run pm2:restart  # après un nouveau build
npm run pm2:stop
```

Configuration : `ecosystem.config.cjs` (app `event-organisation-calendar`, port **4173**).

```bash
# Changer le port
PORT=8080 pm2 start ecosystem.config.cjs --update-env
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (Vite) |
| `npm run build` | Build frontend + vérif TypeScript |
| `npm run start` | Serveur prod (static + API SQLite) |
| `npm run preview` | Aperçu via Vite preview |
| `npm run pm2:start` | Build + lancement PM2 |
| `npm run pm2:restart` | Redémarrage PM2 |
| `npm run pm2:stop` | Arrêt PM2 |
| `npm run lint` | ESLint |

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4, Lucide React
- Persistance SQLite (`node:sqlite`, `server/db.ts`, `server/repository.ts`)

## Structure

```
├── public/          # Favicon, assets statiques
├── server/          # API, serveur prod, plugin Vite
├── ecosystem.config.cjs
├── src/             # Interface React
├── data/            # planning.db (généré localement)
└── postcss.config.mjs
```

## Licence

Projet privé.
