import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import type { HistoryItem } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import Loader from '../components/Loader'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[] | null>(null)

  useEffect(() => {
    if (!user) return
    window.anisav
      .historyList()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
  }, [user])

  if (authLoading) return <Loader />
  if (!user) return <p className="empty">Войди, чтобы видеть историю просмотра</p>
  if (!items) return <Loader />

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="ph">
        <div>
          <h1>История</h1>
          <p>Последние просмотренные серии</p>
        </div>
      </div>
      {items.length === 0 && <p className="empty">История пуста</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items
          .filter((item) => item.release && item.release_episode)
          .map((item) => (
            <Link key={item.id} to={`/title/${item.release.alias || item.release.id}`} className="row-item">
              <img
                src={imageUrl(item.release.poster?.optimized?.thumbnail || item.release.poster?.thumbnail)}
                alt=""
                style={{ width: 40, height: 56, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="line-clamp-2" style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>
                  {item.release.name.main}
                </p>
                <p className="muted" style={{ margin: '3px 0 0', fontSize: 12 }}>
                  Серия {item.release_episode.ordinal}
                  {item.release_episode.name ? ` · ${item.release_episode.name}` : ''}
                </p>
                <p className="mono" style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--dim)' }}>
                  {formatDate(item.updated_at)}
                </p>
              </div>
              <span className={`chip${item.is_watched ? '' : ' on'}`}>
                {item.is_watched ? 'Просмотрено' : 'В процессе'}
              </span>
            </Link>
          ))}
      </div>
    </div>
  )
}
