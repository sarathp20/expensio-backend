import { Router } from "express";
import { prisma } from '../lib/prisma'

const router = Router()
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany()
        res.json(categories)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.post('/', async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: { name: req.body.name, icon: req.body.icon }
        })
        res.json(category)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: { name: req.body.name }
        })
        res.json(category)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const category = await prisma.category.delete({
            where: { id: req.params.id }
        })
        res.json(category)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
    }
})

export default router

