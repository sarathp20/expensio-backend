import axios from 'axios'
import type { Category } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL

export const getCategories = async (): Promise<Category[]> => {
    const response = await axios.get(`${BASE_URL}/categories`)
    return response.data
}

export const createCategory = async (name: string, icon?: string): Promise<Category> => {
    const response = await axios.post(`${BASE_URL}/categories`, { name, icon })
    return response.data
}

export const deleteCategory = async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/categories/${id}`)
}