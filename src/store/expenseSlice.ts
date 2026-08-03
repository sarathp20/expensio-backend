import { createSlice } from "@reduxjs/toolkit";
import type { Expense } from "../types";

interface ExpenseState {
  list: Expense[]
  loading: boolean
  error: string | null
}

const initialState: ExpenseState = {
  list: [],
  loading: false,
  error: null
}

export const expenseSlice = createSlice(
    {
        name: 'expenses',
        initialState,
        reducers: {
            setExpenses: (state, action) => {
                state.list = action.payload
            },
            addExpense: (state, action) => {
                state.list.push(action.payload)
            },
            deleteExpense: (state, action) => {
                state.list = state.list.filter(c => c.id !== action.payload)
            },
            setExpenseLoading: (state, action) => {
                state.loading = action.payload
            }
        }
    }
)

export const { setExpenses, addExpense, deleteExpense, setExpenseLoading } = expenseSlice.actions
export default expenseSlice.reducer