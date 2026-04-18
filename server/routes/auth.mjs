import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.mjs'
import { getJwtSecret } from '../middleware/auth.mjs'

const router = Router()

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' })
  res.cookie('token', token, {
    ...cookieOptions,
    secure: process.env.NODE_ENV === 'production',
  })
}

router.post('/signup', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed },
    })

    setAuthCookie(res, user.id)
    return res.status(201).json({ user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    setAuthCookie(res, user.id)
    return res.json({ user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const token = req.cookies?.token
  if (!token) {
    return res.json({ user: null })
  }
  try {
    const payload = jwt.verify(token, getJwtSecret())
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    })
    if (!user) {
      return res.json({ user: null })
    }
    return res.json({ user })
  } catch {
    return res.json({ user: null })
  }
})

export default router
