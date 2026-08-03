import type { QueueItem } from '../../types'
import styles from './QueueCard.module.scss'

interface Props {
  item: QueueItem
  onTap: (item: QueueItem) => void
  onDelete: (id: string) => void
  onQuickSave: (item: QueueItem) => void
}

const todayLabel = () => {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export const QueueCard = ({ item, onTap, onDelete, onQuickSave }: Props) => {
  const isLoading = item.status === 'loading'
  const isError   = item.status === 'error'
  const isReady   = item.status === 'ready'

  const canQuickSave =
    isReady &&
    item.aiResult?.isCategoryFound &&
    item.aiResult?.category &&
    item.aiResult?.amount > 0 &&
    item.aiResult?.item

  const suggestionCount = item.aiResult?.suggestions?.length ?? 0

  return (
    <div
      className={`${styles.card} ${isReady ? styles.ready : ''} ${isError ? styles.error : ''}`}
      onClick={() => !isLoading && onTap(item)}
    >
      {/* Delete button */}
      <button
        className={styles.deleteBtn}
        onClick={e => { e.stopPropagation(); onDelete(item.id) }}
        aria-label="Remove from queue"
      >
        <i className="ti ti-x"/>
      </button>

      {/* Loading state */}
      {isLoading && (
        <div className={styles.loadingContent}>
          <div className={styles.rawInput}>{item.rawInput}</div>
          <div className={styles.shimmerRow}>
            <div className={styles.shimmer} style={{ width: '60%' }}/>
            <div className={styles.shimmer} style={{ width: '25%' }}/>
          </div>
          <div className={styles.analysingLabel}>Analysing...</div>
        </div>
      )}

      {/* Ready state */}
      {isReady && item.aiResult && (
        <div className={styles.readyContent}>
          <div className={styles.itemRow}>
            <div className={styles.itemLeft}>
              <span className={styles.itemName}>{item.aiResult.item}</span>
              <div className={styles.categoryRow}>
                {item.aiResult.isCategoryFound && item.aiResult.category ? (
                  <>
                    <span className={styles.categoryIcon}>
                      {item.aiResult.category.icon ?? '📦'}
                    </span>
                    <span className={styles.categoryName}>
                      {item.aiResult.category.name}
                    </span>
                  </>
                ) : (
                  <span className={styles.noCategory}>
                    {suggestionCount > 0
                      ? `${suggestionCount} suggestions — tap to pick one`
                      : 'No category matched · tap to add'}
                  </span>
                )}
              </div>
              {/* Date */}
              <span className={styles.dateLabel}>{todayLabel()}</span>
            </div>

            <div className={styles.itemRight}>
              <span className={styles.itemAmount}>
                ₹{item.aiResult.amount.toLocaleString('en-IN')}
              </span>
              {canQuickSave && (
                <button
                  className={styles.quickSaveBtn}
                  onClick={e => { e.stopPropagation(); onQuickSave(item) }}
                  aria-label="Quick save"
                  title="Save directly"
                >
                  <i className="ti ti-check"/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className={styles.errorContent}>
          <div className={styles.rawInput}>{item.rawInput}</div>
          <div className={styles.errorLabel}>
            <i className="ti ti-alert-circle"/> AI failed · Tap to fill manually
          </div>
        </div>
      )}
    </div>
  )
}
