import { useState } from "react"
import styles from './SmartInput.module.scss'

interface Props {
  onSubmit: (input: string) => void
  isLoading: boolean
}

export const SmartInput = ({ onSubmit, isLoading }: Props) => {
    const [input, setInput] = useState<string>('')
    const handleOnInputSubmit = () => {
        onSubmit(input)
        setInput('')
    }

    return (
        <div className={styles.inputRow}>
                <textarea disabled={isLoading} className={styles.textarea} onChange={(e) => setInput(e.target.value)} placeholder="Enter your expense here, we will categories and store it" />
                <button className={styles.submitBtn} onClick={handleOnInputSubmit} 
                // disabled={isLoading || input.length===0}
                >✨</button>
        </div>
    )
}