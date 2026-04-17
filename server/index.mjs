import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const PORT = Number(process.env.PORT) || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me'

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  })
}

async function requireUser(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' })
    }
    req.user = { id: user.id, email: user.email }
    next()
  } catch {
    return res.status(401).json({ error: '인증이 만료되었습니다.' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: '이메일과 비밀번호를 입력해 주세요.' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' })
    }
    const normalized = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다.' })
    }
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    })
    if (existing) {
      return res.status(409).json({ error: '이미 가입된 이메일입니다.' })
    }
    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await prisma.user.create({
      data: { email: normalized, passwordHash },
    })
    const token = signToken(user)
    res.cookie('token', token, cookieBase)
    res.json({ user: { id: user.id, email: user.email } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const normalized = String(email || '').trim().toLowerCase()
    const user = await prisma.user.findUnique({
      where: { email: normalized },
    })
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res
        .status(401)
        .json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }
    const token = signToken(user)
    res.cookie('token', token, cookieBase)
    res.json({ user: { id: user.id, email: user.email } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieBase, maxAge: 0 })
  res.json({ ok: true })
})

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies?.token
  if (!token) {
    return res.json({ user: null })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return res.json({ user: null })
    }
    res.json({ user: { id: user.id, email: user.email } })
  } catch {
    res.json({ user: null })
  }
})

app.get('/api/notes', requireUser, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ notes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '메모를 불러오지 못했습니다.' })
  }
})

app.post('/api/notes', requireUser, async (req, res) => {
  try {
    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        title: String(req.body?.title ?? ''),
        content: String(req.body?.content ?? ''),
      },
    })
    res.status(201).json({ note })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '메모를 만들지 못했습니다.' })
  }
})

app.patch('/api/notes/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params
    const owned = await prisma.note.findFirst({
      where: { id, userId: req.user.id },
    })
    if (!owned) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }
    const data = {}
    if (req.body?.title !== undefined) data.title = String(req.body.title)
    if (req.body?.content !== undefined) data.content = String(req.body.content)
    const note = await prisma.note.update({ where: { id }, data })
    res.json({ note })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '메모를 저장하지 못했습니다.' })
  }
})

app.delete('/api/notes/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params
    const owned = await prisma.note.findFirst({
      where: { id, userId: req.user.id },
    })
    if (!owned) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }
    await prisma.note.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '메모를 삭제하지 못했습니다.' })
  }
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
