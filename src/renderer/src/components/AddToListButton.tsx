import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import type { CollectionType } from '../../../shared/types'

const LABELS: Record<CollectionType, string> = {
  WATCHING: 'Смотрю',
  PLANNED: 'Запланировано',
  WATCHED: 'Просмотрено',
  POSTPONED: 'Отложено',
  ABANDONED: 'Брошено',
}

function extractCollectionType(items: unknown, releaseId: number): CollectionType | null {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    if (item && typeof item === 'object' && 'release_id' in item && 'type_of_collection' in item) {
      const o = item as { release_id: number; type_of_collection: CollectionType }
      if (o.release_id === releaseId) return o.type_of_collection
    }
  }
  return null
}

function extractIsFavorite(items: unknown, releaseId: number): boolean {
  if (!Array.isArray(items)) return false
  return items.some((item) => {
    if (typeof item === 'number') return item === releaseId
    if (item && typeof item === 'object' && 'release_id' in item) {
      return (item as { release_id: number }).release_id === releaseId
    }
    return false
  })
}

export default function AddToListButton({ releaseId }: { releaseId: number }) {
  const { user } = useAuth()
  const [collectionType, setCollectionType] = useState<CollectionType | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    window.anisav
      .collectionIds()
      .then((ids) => setCollectionType(extractCollectionType(ids, releaseId)))
      .catch(() => {})
    window.anisav
      .favoriteIds()
      .then((ids) => setIsFavorite(extractIsFavorite(ids, releaseId)))
      .catch(() => {})
  }, [user, releaseId])

  if (!user) return null

  async function pick(type: CollectionType) {
    setBusy(true)
    try {
      await window.anisav.collectionAdd(releaseId, type)
      setCollectionType(type)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function removeFromList() {
    setBusy(true)
    try {
      await window.anisav.collectionRemove(releaseId)
      setCollectionType(null)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function toggleFavorite() {
    setBusy(true)
    try {
      if (isFavorite) await window.anisav.favoriteRemove(releaseId)
      else await window.anisav.favoriteAdd(releaseId)
      setIsFavorite(!isFavorite)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          className={`btn btn-sm ${collectionType ? 'btn-ghost' : 'btn-primary'}`}
        >
          {collectionType ? LABELS[collectionType] : 'Добавить в список'}
        </button>
        {open && (
          <div className="menu fade-in" style={{ left: 0, top: '100%', marginTop: 4 }} onMouseLeave={() => setOpen(false)}>
            {(Object.keys(LABELS) as CollectionType[]).map((t) => (
              <button key={t} onClick={() => pick(t)} className={collectionType === t ? 'on' : ''}>
                {LABELS[t]}
              </button>
            ))}
            {collectionType && (
              <button onClick={removeFromList} className="danger">
                Убрать из списка
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={toggleFavorite}
        disabled={busy}
        title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
        className={`icon-btn${isFavorite ? ' on' : ''}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  )
}
