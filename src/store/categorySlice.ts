import { createSlice } from "@reduxjs/toolkit";
import type { Category } from "../types";

interface CategoryState {
  list: Category[]
  loading: boolean
  error: string | null
}

const initialState: CategoryState = {
  list: [],
  loading: false,
  error: null
}

export const categorySlice = createSlice(
    {
        name: 'categories',
        initialState,
        reducers: {
            setCategories: (state, action) => {
                state.list = action.payload
            },
            addCategory: (state, action) => {
                state.list.push(action.payload)
            },
            deleteCategory: (state, action) => {
                state.list = state.list.filter(c => c.id !== action.payload)
            },
            setCategoriesLoading: (state, action) => {
                state.loading = action.payload
            },
            setCategoriesError: (state, action) => {
                state.error = action.payload
            },
        }
    }
)

export const { setCategories, addCategory, deleteCategory, setCategoriesLoading, setCategoriesError } = categorySlice.actions
export default categorySlice.reducer