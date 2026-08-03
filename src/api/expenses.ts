import axios from 'axios'
import type { Expense } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await axios.get(`${BASE_URL}/expenses`)
  return response.data
}

export const createExpense = async (
  description: string,
  amount: number,
  categoryId: string,
  date?: string
): Promise<Expense> => {
  const response = await axios.post(`${BASE_URL}/expenses`, {
    description,
    amount,
    categoryId,
    date
  })
  return response.data
}

export const deleteExpense = async (id: string): Promise<void> => {
  await axios.delete(`${BASE_URL}/expenses/${id}`)
}