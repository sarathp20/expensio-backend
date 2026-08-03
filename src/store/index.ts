import { configureStore } from "@reduxjs/toolkit";
import categorySlice from "./categorySlice";
import expenseSlice from "./expenseSlice";

export const store = configureStore(
    {
        reducer: {
            categories: categorySlice,
            expenses: expenseSlice
        }
    }
)
 
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
