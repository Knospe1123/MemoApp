import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production'

export function getJwtSecret() {
  return JWT_SECRET
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: '세션이 만료되었거나 유효하지 않습니다.' })
  }
}
