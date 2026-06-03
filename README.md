# Planning Bénévoles

Application pour organiser les disponibilités et les affectations des bénévoles pendant un événement.

## Démarrage

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173). L’API tourne dans le même serveur Vite (pas de port 3001 séparé).

Les données sont enregistrées dans `data/store.json` et partagées entre tous les navigateurs qui accèdent au site.

## Production

```bash
npm run build
npm run preview
```

`preview` sert aussi l’API via le plugin Vite.
