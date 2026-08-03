import axios from 'axios'
import type { AIResult, Category } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL

export const catagoriseExpense = async (message: string, categories: Category[]): Promise<AIResult> => {
    const response = await axios.post(`${BASE_URL}/ai`, { message, categories })
    return response.data
}