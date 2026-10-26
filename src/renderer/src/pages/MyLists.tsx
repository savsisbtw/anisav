import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import type { CollectionType, Release } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import Loader from '../components/Loader'

const TABS: Array<{ key: CollectionType | 'FAVORITES'; label: string }> = [
  { key: 'WATCHING', label: 'Смотрю' },
  { key: 'PLANNED', label: 'Запланировано' },
  { key: 'WATCHED', label: 'Просмотрено' },
  { key: 'POSTPONED', label: 'Отложено' },
  { key: 'ABANDONED', label: 'Брошено' },
  { key: 'FAVORITES', label: 'Избранное' },
]

export default function MyLists() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('WATCHING')
  const [releases, setReleases] = useState<Release[] | null>(null)

  useEffect(() => {
    if (!user) return
    setReleases(null)
    const req =
      tab === 'FAVORITES'
        ? window.anisav.favoritesList(1, 48)
        : window.anisav.collectionList(tab, 1, 48)
    req.then((res) => setReleases(res.data)).catch(() => setReleases([]))
  }, [tab, user])

  if (authLoading) return <Loader />
  if (!user) return <p className="empty">Войди, чтобы видеть свои списки</p>

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Мои списки</h1>
          <p>Списки из твоего аккаунта AniLiberty</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab${tab === t.key ? ' on' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!releases && <Loader />}
      {releases && releases.length === 0 && <p className="empty">Список пуст</p>}
      {releases && releases.length > 0 && (
        <div key={tab} className="grid-posters fade-in">
          {releases.map((r) => (
            <AnimeCard key={r.id} release={r} />
          ))}
        </div>
      )}
    </div>
  )
}
