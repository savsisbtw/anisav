import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../lib/api'
import { getContinueWatching, ContinueWatchingItem } from '../lib/continueWatching'
import type { Release, ScheduleDay } from '../../../shared/types'
import Row from '../components/Row'
import Featured from '../components/Featured'
import Reveal from '../components/Reveal'
import { stagger } from '../lib/motion'
import { onlyOnYummy, yummyCatalog } from '../lib/yummy'
import { GridSkeleton } from '../components/Skeleton'

export default function Home() {
  const [latest, setLatest] = useState<Release[] | null>(null)
  const [recommended, setRecommended] = useState<Release[] | null>(null)
  const [today, setToday] = useState<ScheduleDay[] | null>(null)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])
  const [yummyOnly, setYummyOnly] = useState<Release[]>([])

  useEffect(() => {
    yummyCatalog('views', 0, 60)
      .then((page) => onlyOnYummy(page.items))
      .then((items) => setYummyOnly(items.slice(0, 14)))
      .catch(() => {})
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

      {latest && latest.length > 0 && <Featured releases={latest} />}

      {continueWatching.length > 0 && (
        <Reveal className="section">
          <h2 className="section-title">Продолжить просмотр</h2>
          <div className="grid-posters">
            {continueWatching.map((c, i) => (
              <Link key={c.episode.id} to={`/title/${c.release.alias || c.release.id}`} state={{ release: c.release }} className="poster" style={stagger(i)}>
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
        </Reveal>
      )}

      <Row title="Онгоинги сегодня" to="/schedule" releases={today?.map((s) => s.release).filter(Boolean) ?? []} />
      <Row title="Последние обновления" to="/catalog" releases={latest ?? []} />
      <Row title="Рекомендуем" releases={recommended ?? []} />
      <Row title="Только на Yummy" to="/yummy" releases={yummyOnly} />
    </div>
  )
}
