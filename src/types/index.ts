export interface Category {
  id: string
  name: string
  icon?: string
  createdAt: string
  expenses?: Expense[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  subcategory?: string
  date: string
  createdAt: string
  categoryId: string
  category: Category
}

export interface CategorySuggestion {
  name: string
  icon: string
}

export interface AIResult {
  item: string
  amount: number
  isCategoryFound: boolean
  confidence: number
  category: Category | null
  suggestions: CategorySuggestion[]
}

export interface QueueItem {
  id: string
  rawInput: string
  status: 'loading' | 'ready' | 'error'
  aiResult: AIResult | null
}