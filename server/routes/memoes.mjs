import { Router } from 'express'
import { prisma } from '../lib/prisma.mjs'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const memos = await prisma.memo.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    })
    return res.json({ memos })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '메모 목록을 불러오지 못했습니다.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const title = String(req.body?.title ?? '')
    const content = String(req.body?.content ?? '')
    const memo = await prisma.memo.create({
      data: { userId: req.userId, title, content },
    })
    return res.status(201).json({ memo })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '메모를 만들지 못했습니다.' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const owned = await prisma.memo.findFirst({
      where: { id, userId: req.userId },
    })
    if (!owned) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }
    const title =
      req.body?.title !== undefined ? String(req.body.title) : undefined
    const content =
      req.body?.content !== undefined ? String(req.body.content) : undefined

    const memo = await prisma.memo.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    })
    return res.json({ memo })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '메모를 저장하지 못했습니다.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const owned = await prisma.memo.findFirst({
      where: { id, userId: req.userId },
    })
    if (!owned) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }
    await prisma.memo.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '메모를 삭제하지 못했습니다.' })
  }
})

export default router
