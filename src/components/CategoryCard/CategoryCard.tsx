import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Expense } from '../../types'
import styles from './CategoryCard.module.scss'

interface Props {
  id: string
  name: string
  icon?: string | null
  total: number
  color: string
  expenses: Expense[]
  onDelete: (id: string) => void
  isUpdating: boolean
}

const LONG_PRESS_MS = 600

export const CategoryCard = ({ id, name, icon, total, color, expenses, onDelete, isUpdating }: Props) => {
  const [isOpen, setIsOpen]         = useState(false)
  const [editMode, setEditMode]     = useState(false) // long press activates this
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const fmt        = (n: number) => n.toLocaleString('en-IN')
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })

  // ── Long press ────────────────────────────────────────
  const onPressStart = () => {
    didLongPress.current = false
    timerRef.current = setTimeout(() => {
      didLongPress.current = true
      if (navigator.vibrate) navigator.vibrate(60)
      setEditMode(true)   // enter edit mode — shows drag + delete
      setIsOpen(false)    // collapse if open
    }, LONG_PRESS_MS)
  }

  const onPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (didLongPress.current) return // long press handled — ignore release
    // Short tap
    if (editMode) {
      setEditMode(false)  // tap to exit edit mode
    } else {
      setIsOpen(prev => !prev)
    }
  }

  const onPressCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${editMode ? styles.editMode : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div
        className={styles.header}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressCancel}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        onTouchCancel={onPressCancel}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        {/* Accent bar */}
        <div
          className={styles.accentBar}
          style={{ background: editMode ? 'var(--danger)' : color }}
        />

        {/* Icon */}
        <div className={styles.iconWrap}>
          <span>{icon ?? '📦'}</span>
        </div>

        {/* Name */}
        <div className={styles.nameWrap}>
          <span className={styles.name}>{name}</span>
          {editMode && (
            <span className={styles.editHint}>Tap to cancel</span>
          )}
        </div>

        {/* Amount */}
        {!isUpdating && <span
          className={styles.amount}
          style={{ color: editMode ? 'var(--danger)' : color }}
        >
          ₹{fmt(total)}
        </span>}
        {isUpdating && <div className={styles.shimmer} style={{ width: '25%' }}/>}

        {/* Normal state: chevron only */}
        {!editMode && (
          <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} ${styles.chevron}`}/>
        )}

        {/* Edit mode: drag handle + delete button */}
        {editMode && (
          <>
            {/* Drag handle — only active in edit mode */}
            <div
              className={styles.dragHandle}
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => {
                e.stopPropagation()
              }}
              onTouchEnd={e => e.stopPropagation()}
            >
              <i className="ti ti-grip-vertical"/>
            </div>

            {/* Delete button */}
            <button
              className={styles.deleteIconBtn}
              onClick={e => { e.stopPropagation(); onDelete(id) }}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              aria-label="Delete category"
            >
              <i className="ti ti-trash"/>
            </button>
          </>
        )}
      </div>

      {/* Expanded expense list — only in normal mode */}
      {isOpen && !editMode && (
        <div className={styles.expenseList}>
          {expenses.length === 0 ? (
            <div className={styles.noExpenses}>No expenses in this period</div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className={styles.expenseRow} >
                <span className={styles.expName}>{exp.description}</span>
                <span className={styles.expDate}>{formatDate(exp.date)}</span>
                <span className={styles.expAmt}>₹{fmt(exp.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
