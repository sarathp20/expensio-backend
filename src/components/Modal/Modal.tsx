import { useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.scss'

interface Props {
  children: ReactNode
  onClose: () => void
}

export const Modal = ({ children, onClose }: Props) => {
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 300) // matches animation duration
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${closing ? styles.closing : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — visual cue to swipe down */}
        <div className={styles.dragHandle} onClick={handleClose}/>
        {children}
      </div>
    </div>
  )
}
