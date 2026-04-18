import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRouter from './routes/auth.mjs'
import memoesRouter from './routes/memoes.mjs'
import { requireAuth } from './middleware/auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true)
    return
  }
  const client = process.env.CLIENT_ORIGIN
  if (client && origin === client) {
    callback(null, true)
    return
  }
  try {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost' || hostname.endsWith('.vercel.app')) {
      callback(null, true)
      return
    }
  } catch {
    callback(null, false)
    return
  }
  callback(null, false)
}

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/memoes', requireAuth, memoesRouter)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  })

  return app
}
