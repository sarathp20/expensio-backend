import { useEffect, useMemo, useRef, useState } from 'react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { deleteCategory as deleteCategoryApi, getCategories } from '../../api/categories'
import { deleteCategory, setCategories, setCategoriesError, setCategoriesLoading } from '../../store/categorySlice'
import { createExpense, getExpenses } from '../../api/expenses'
import { addExpense, setExpenseLoading, setExpenses } from '../../store/expenseSlice'
import { catagoriseExpense } from '../../api/ai'
import { Modal } from '../../components/Modal/Modal'
import { AddExpenseForm } from '../../components/AddExpenseForm/AddExpenseForm'
import { CategoryCard } from '../../components/CategoryCard/CategoryCard'
import { QueueCard } from '../../components/QueueCard/QueueCard'
import type { Expense, QueueItem } from '../../types'
import styles from './Dashboard.module.scss'

const COLORS = [
    '#1D9E75', '#7F77DD', '#D85A30',
    '#378ADD', '#639922', '#BA7517',
    '#C4528A', '#4A9E8E',
]

type Filter = 'today' | 'week' | 'month' | 'all'

function filterByDate(expenses: Expense[], filter: Filter): Expense[] {
    const now = new Date()
    return expenses.filter(e => {
        const d = new Date(e.date)
        if (filter === 'today') return d.toDateString() === now.toDateString()
        if (filter === 'week') {
            const ago = new Date(now)
            ago.setDate(now.getDate() - 7)
            return d >= ago
        }
        if (filter === 'month') {
            return d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
        }
        return true
    })
}

const R = 72
const CIRCUMFERENCE = 2 * Math.PI * R
const GAP = 4

function buildSegments(
    cats: { name: string; total: number; color: string }[],
    grandTotal: number
) {
    if (grandTotal === 0) return []
    const active = cats.filter(c => c.total > 0)
    const available = CIRCUMFERENCE - active.length * GAP
    let cumulative = 0
    return active.map(cat => {
        const arcLength = (cat.total / grandTotal) * available
        const rotation = (cumulative / CIRCUMFERENCE) * 360
        cumulative += arcLength + GAP
        return { name: cat.name, color: cat.color, arcLength, rotation }
    })
}

export default function Dashboard() {
    const dispatch = useAppDispatch()
    const { list: categoriesList, loading: catLoading, error: catError } = useAppSelector(s => s.categories)
    const { list: expensesList } = useAppSelector(s => s.expenses)

    const [filter, setFilter] = useState<Filter>('today')
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [activeItem, setActiveItem] = useState<QueueItem | null>(null)
    const [smartInput, setSmartInput] = useState('')
    const [categoryOrder, setCategoryOrder] = useState<string[]>([])
    const [updatingItems, setUpdatingItems] = useState<QueueItem[] | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // ── DnD sensors — pointer for desktop, touch for mobile ──
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 100, tolerance: 8 }
        })
    )

    // ── Fetch on mount ────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            dispatch(setCategoriesLoading(true))
            const cats = await getCategories()
            dispatch(setCategories(cats))
            dispatch(setCategoriesLoading(false))
        }
        load()
    }, [])

    useEffect(() => {
        const load = async () => {
            dispatch(setExpenseLoading(true))
            const exps = await getExpenses()
            dispatch(setExpenses(exps))
            dispatch(setExpenseLoading(false))
        }
        load()
    }, [])

    // ── Sync category order when list loads ───────────────
    useEffect(() => {
        setCategoryOrder(prev => {
            if (prev.length === 0) return categoriesList.map(c => c.id)
            const prevSet = new Set(prev)
            const newIds = categoriesList
                .map(c => c.id)
                .filter(id => !prevSet.has(id))
            if (newIds.length === 0) return prev
            return [...prev, ...newIds]
        })
    }, [categoriesList])

    // ── Derived data ──────────────────────────────────────
    const filtered = filterByDate(expensesList, filter)

    const categoriesWithExpenses = categoriesList.map((cat, i) => ({
        ...cat,
        color: COLORS[i % COLORS.length],
        expenses: filtered.filter(e => e.categoryId === cat.id),
        total: filtered
            .filter(e => e.categoryId === cat.id)
            .reduce((sum, e) => sum + e.amount, 0),
    }))

    // Sort by user-defined order
    const sortedCategories = categoryOrder
        .map(id => categoriesWithExpenses.find(c => c.id === id))
        .filter(Boolean) as typeof categoriesWithExpenses

    const grandTotal = sortedCategories.reduce((s, c) => s + c.total, 0)
    const fmt = (n: number) => n.toLocaleString('en-IN')

    const segments = buildSegments(
        sortedCategories.map(c => ({ name: c.name, total: c.total, color: c.color })),
        grandTotal
    )

    const periodLabel = () => {
        const now = new Date()
        if (filter === 'today') return now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        if (filter === 'week') return 'Last 7 days'
        if (filter === 'month') return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        return 'All time'
    }

    // ── DnD reorder ───────────────────────────────────────
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setCategoryOrder(prev => {
                const oldIndex = prev.indexOf(String(active.id))
                const newIndex = prev.indexOf(String(over.id))
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }

    // ── Category delete ───────────────────────────────────
    const handleDeleteCategory = async (id: string) => {
        try {
            dispatch(setCategoriesLoading(true))
            await deleteCategoryApi(id)
            dispatch(deleteCategory(id))
            setCategoryOrder(prev => prev.filter(cid => cid !== id))
        } catch {
            dispatch(setCategoriesError('Error deleting category'))
        } finally {
            dispatch(setCategoriesLoading(false))
        }
    }

    // ── Smart input → queue ───────────────────────────────
    const handleSmartSubmit = async () => {
        if (!smartInput.trim()) return
        const newItem: QueueItem = {
            id: crypto.randomUUID(),
            rawInput: smartInput.trim(),
            status: 'loading',
            aiResult: null,
        }
        setQueue(prev => [...prev, newItem])
        setSmartInput('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        try {
            const result = await catagoriseExpense(newItem.rawInput, categoriesList)
            setQueue(prev => prev.map(item =>
                item.id === newItem.id
                    ? { ...item, status: 'ready', aiResult: result }
                    : item
            ))
        } catch {
            setQueue(prev => prev.map(item =>
                item.id === newItem.id
                    ? { ...item, status: 'error', aiResult: null }
                    : item
            ))
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSmartInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
    }

    // ── Queue actions ─────────────────────────────────────
    const handleQueueTap = (item: QueueItem) => setActiveItem(item)
    const handleQueueDelete = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id))
        if (activeItem?.id === id) setActiveItem(null)
    }
    const handleDismiss = () => setActiveItem(null)
    const handleDelete = () => {
        if (activeItem) {
            setQueue(prev => prev.filter(i => i.id !== activeItem.id))
            setActiveItem(null)
        }
    }
    const handleSave = () => {
        if (activeItem) {
            setQueue(prev => prev.filter(i => i.id !== activeItem.id))
            setActiveItem(null)
        }
    }
    const handleManualAdd = () => {
        setActiveItem({
            id: crypto.randomUUID(),
            rawInput: '',
            status: 'ready',
            aiResult: null,
        })
    }

    const TABS: { key: Filter; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'all', label: 'All' },
    ]

    const handleQuickSave = async (item: QueueItem) => {
        if (!item.aiResult?.category) return
        try {
            setQueue(prev => prev.filter(i => i.id !== item.id))
            setUpdatingItems(prev => {
                if (Array.isArray(prev)) {
                    return [...prev, item]
                } else {
                    return [item]
                }
            })
            const response = await createExpense(
                item.aiResult.item,
                item.aiResult.amount,
                item.aiResult.category.id
            )
            dispatch(addExpense(response))
        } catch (e) {
            console.log('Quick save failed', e)
        } finally {
            setUpdatingItems(prev => prev && prev.length>1 ? prev.filter(i => i.id !== item.id) : null)
        }
    }

    const updatingCategoryIds = useMemo(() => {

        return new Set(
            updatingItems ? (updatingItems.map(item => item.aiResult?.category?.id)
                .filter((id): id is string => Boolean(id))) : [])
    }, [updatingItems])

    return (
        <div className={styles.dashboard}>

            <div className={styles.topbar}>
                <span className={styles.logo}>Expensio</span>
                <button className={styles.addBtn} onClick={handleManualAdd}>+ Add</button>
            </div>

            <div className={styles.hero}>
                <div className={styles.donutWrap}>
                    <svg
                        className={`${styles.donutSvg} ${updatingItems ? styles.loadingDonut : ''}`}
                        viewBox="0 0 180 180"
                        aria-hidden="true"
                    >
                        <circle cx="90" cy="90" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
                        {segments.map(seg => (
                            <circle
                                key={seg.name}
                                cx="90" cy="90" r={R}
                                stroke={seg.color}
                                strokeWidth="14"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${seg.arcLength} ${CIRCUMFERENCE}`}
                                strokeDashoffset={0}
                                // The inline transform acts as the starting orientation
                                transform={`rotate(${seg.rotation - 90}, 90, 90)`}
                            />
                        ))}
                    </svg>

                    <div className={styles.donutCenter}>
                        <span className={styles.donutLabel}>Spent</span>
                        {updatingItems ? <div className={styles.shimmer} style={{ width: '25%' }} /> : <span className={styles.donutAmount}>₹{fmt(grandTotal)}</span>}
                        <span className={styles.donutSub}>{periodLabel()}</span>
                    </div>
                </div>

                {sortedCategories.filter(c => c.total > 0).length > 0 && (
                    <div className={styles.legend}>
                        {sortedCategories.filter(c => c.total > 0).map(cat => (
                            <div key={cat.id} className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: cat.color }} />
                                <span className={styles.legendName}>{cat.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.filters}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`${styles.filterTab} ${filter === t.key ? styles.active : ''}`}
                        onClick={() => setFilter(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Category list with DnD */}
            <div className={styles.list}>
                {catLoading && <div className={styles.empty}>Loading...</div>}
                {catError && <div className={styles.empty}>{catError}</div>}
                {!catLoading && categoriesList.length === 0 && (
                    <div className={styles.empty}>
                        No categories yet.<br />Type an expense below to get started.
                    </div>
                )}
                {!catLoading && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={categoryOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            {sortedCategories.map(cat => (
                                <CategoryCard
                                    key={cat.id}
                                    id={cat.id}
                                    name={cat.name}
                                    icon={cat.icon}
                                    total={cat.total}
                                    color={cat.color}
                                    expenses={cat.expenses}
                                    onDelete={handleDeleteCategory}
                                    isUpdating={updatingCategoryIds.has(cat.id)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Queue — floats above input */}
            {queue.length > 0 && (
                <div className={styles.queueSection}>
                    {[...queue].map(item => (
                        <QueueCard
                            key={item.id}
                            item={item}
                            onTap={handleQueueTap}
                            onDelete={handleQueueDelete}
                            onQuickSave={handleQuickSave}
                        />
                    ))}
                </div>
            )}

            {/* Active item form */}
            {activeItem && (
                <Modal onClose={handleDismiss}>
                    <AddExpenseForm
                        onClose={handleSave}
                        onDelete={handleDelete}
                        isLoading={activeItem.status === 'loading'}
                        aiResults={activeItem.aiResult}
                        categories={categoriesList}
                    />
                </Modal>
            )}

            <div className={styles.bottomBar}>
                <div className={styles.inputRow}>
                    <textarea
                        ref={textareaRef}
                        className={styles.inputField}
                        placeholder="What did you spend on?"
                        value={smartInput}
                        onChange={handleInput}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSmartSubmit()
                            }
                        }}
                        rows={1}
                    />
                    <button
                        className={styles.aiBtn}
                        onClick={handleSmartSubmit}
                        disabled={!smartInput.trim()}
                    >
                        <i className="ti ti-sparkles" />
                        <span>Smart</span>
                    </button>
                </div>
                <div className={styles.inputHint}>Long press to delete · Drag ≡ to reorder</div>
            </div>
        </div>
    )
}
