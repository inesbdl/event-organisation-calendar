import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { handleApi } from './api-handlers.js'

function apiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (!req.url?.startsWith('/api')) {
    next()
    return
  }
  handleApi(req, res).catch(() => {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Erreur serveur' }))
  })
}

export function apiPlugin(): Plugin {
  return {
    name: 'planning-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware)
    },
  }
}
