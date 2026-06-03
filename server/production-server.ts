import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api-handlers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')

const port = Number(process.env.PORT) || 4173
const host = process.env.HOST ?? '0.0.0.0'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

if (!fs.existsSync(indexHtml)) {
  console.error('Build manquant : lancez « npm run build » avant de démarrer le serveur.')
  process.exit(1)
}

function resolveStaticPath(urlPath: string): string | null {
  const pathname = decodeURIComponent(urlPath.split('?')[0])
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '')
  const filePath = path.normalize(path.join(distDir, relative))
  if (!filePath.startsWith(distDir)) return null
  return filePath
}

function sendFile(filePath: string, res: http.ServerResponse) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.end('Not found')
      return
    }
    const ext = path.extname(filePath)
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    res.end(data)
  })
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const filePath = resolveStaticPath(req.url ?? '/')
  if (!filePath) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(filePath, res)
      return
    }
    sendFile(indexHtml, res)
  })
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api')) {
    handleApi(req, res).catch(() => {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Erreur serveur' }))
    })
    return
  }
  serveStatic(req, res)
})

server.listen(port, host, () => {
  console.log(`Planning bénévoles — http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
})
