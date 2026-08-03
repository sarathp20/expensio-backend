import { useState } from 'react'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { createCategory } from '../../api/categories'
import { addCategory } from '../../store/categorySlice'
import { FormLoading } from '../FormLoading/FormLoading'
import styles from './AddCategoryForm.module.scss'

interface Props {
  onCreate: (categoryId: string) => void
  onClose: () => void
}

export const AddCategoryForm = ({ onCreate, onClose }: Props) => {
  const [name, setName]       = useState('')
  const [icon, setIcon]       = useState('')
  const [saving, setSaving]   = useState(false)
  const dispatch = useAppDispatch()

  const handleOnCreate = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      const response = await createCategory(name, icon)
      dispatch(addCategory(response))
      onCreate(response.id)
      onClose()
    } catch (e) {
      console.log('Error creating category', e)
    } finally {
      setSaving(false)
    }
  }

  if (saving) {
    return (
      <div className={styles.loadingWrap}>
        <FormLoading />
        <FormLoading />
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <p className={styles.title}>New Category</p>
      <input
        className={styles.input}
        value={name}
        required
        onChange={e => setName(e.target.value)}
        placeholder="Category name"
      />
      <input
        className={styles.input}
        value={icon}
        onChange={e => setIcon(e.target.value)}
        placeholder="Icon emoji (optional)"
      />
      <button
        className={styles.createBtn}
        onClick={handleOnCreate}
        disabled={!name.trim() || saving}
      >
        {saving ? 'Creating...' : 'Create Category'}
      </button>
    </div>
  )
}
