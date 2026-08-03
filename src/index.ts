import express from 'express'
import cors from 'cors'
import categoryRoutes from './routes/categories'
import expenseRoutes from './routes/expenses'
import aiRoutes from './routes/ai'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/categories', categoryRoutes)
app.use('/expenses', expenseRoutes)
app.use('/ai', aiRoutes)
app.get('/', (req, res) => {
    res.json({ message: 'Expensio API running' })
}
)
app.listen(3000, () => console.log('running'))
