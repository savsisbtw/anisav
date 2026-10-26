import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../lib/api'
import { getContinueWatching, ContinueWatchingItem } from '../lib/continueWatching'
import type { Release, ScheduleDay } from '../../../shared/types'
import Row from '../components/Row'
import { GridSkeleton } from '../components/Skeleton'

export default function Home() {
  const [latest, setLatest] = useState<Release[] | null>(null)
  const [recommended, setRecommended] = useState<Release[] | null>(null)
  const [today, setToday] = useState<ScheduleDay[] | null>(null)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])

  useEffect(() => {
    api.latest(21).then(setLatest).catch(() => setLatest([]))
    api.recommended(14).then(setRecommended).catch(() => setRecommended([]))
    api.scheduleNow().then((s) => setToday(s.today)).catch(() => setToday([]))
    getContinueWatching().then(setContinueWatching).catch(() => setContinueWatching([]))
  }, [])

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Главная</h1>
          <p>Свежие релизы и то, что ты смотришь</p>
        </div>
      </div>

      {!latest && <GridSkeleton count={12} />}

      {continueWatching.length > 0 && (
        <section className="section">
          <h2 className="section-title">Продолжить просмотр</h2>
          <div className="grid-posters">
            {continueWatching.map((c) => (
              <Link key={c.episode.id} to={`/title/${c.release.alias || c.release.id}`} className="poster">
                <div className="poster-img">
                  <img
                    src={imageUrl(c.release.poster?.optimized?.preview || c.release.poster?.preview)}
                    alt={c.release.name.main}
                    loading="lazy"
                  />
                </div>
                {c.episode.duration ? (
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, (c.time / c.episode.duration) * 100)}%` }} />
                  </div>
                ) : null}
                <p className="poster-title line-clamp-2">{c.release.name.main}</p>
                <p className="poster-meta">Серия {c.episode.ordinal}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Row title="Онгоинги сегодня" releases={today?.map((s) => s.release).filter(Boolean) ?? []} />
      <Row title="Последние обновления" releases={latest ?? []} />
      <Row title="Рекомендуем" releases={recommended ?? []} />
    </div>
  )
}
