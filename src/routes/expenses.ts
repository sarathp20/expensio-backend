import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/', async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({
            include: { category: true },
            orderBy: { date: 'desc' }
        })
        res.json(expenses)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.post('/', async (req, res) => {
  let retries = 3
  while (retries > 0) {
    try {
      const expense = await prisma.expense.create({
        data: {
          description: req.body.description,
          amount:      req.body.amount,
          categoryId:  req.body.categoryId,
          subcategory: req.body.subcategory,
          date: req.body.date ? new Date(req.body.date) : new Date()
        },
        include: { category: true }
      })
      return res.json(expense)
    } catch (error: any) {
      retries--
      if (retries === 0 || error?.code !== 'P2024') {
        return res.status(500).json({ error: 'Something went wrong' })
      }
      await new Promise(r => setTimeout(r, 500))
    }
  }
})

router.put('/:id', async (req, res) => {
    try {
        const expense = await prisma.expense.update({
            where: { id: req.params.id },
            data: {
                description: req.body.description,
                amount: req.body.amount,
                ...(req.body.date && { date: new Date(req.body.date) })
            }
        })
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const expense = await prisma.expense.delete({
            where: { id: req.params.id }
        })
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

export default router