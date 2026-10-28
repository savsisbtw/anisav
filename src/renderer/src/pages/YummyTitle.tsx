import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { Release, YummyVideo } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import { yummyTitle, yummyVideos } from '../lib/yummy'
import Loader from '../components/Loader'
import WishlistButton from '../components/WishlistButton'

function unique(list: string[]) {
  return list.filter((v, i) => list.indexOf(v) === i)
}

function byNumber(a: YummyVideo, b: YummyVideo) {
  const x = parseFloat(a.number)
  const y = parseFloat(b.number)
  if (Number.isNaN(x) || Number.isNaN(y)) return a.number.localeCompare(b.number)
  return x - y
}

export default function YummyTitle() {
  const { id } = useParams()
  const location = useLocation()
  const yid = Number(id)

  const [release, setRelease] = useState<Release | null>(null)
  const [videos, setVideos] = useState<YummyVideo[] | null>(null)
  const [error, setError] = useState(false)
  const [dubbing, setDubbing] = useState('')
  const [player, setPlayer] = useState('')
  const [number, setNumber] = useState('')

  useEffect(() => {
    if (!yid) return
    setRelease(null)
    setVideos(null)
    setError(false)
    yummyTitle(yid)
      .then(setRelease)
      .catch(() => setError(true))
    yummyVideos(yid)
      .then(setVideos)
      .catch(() => setVideos([]))
  }, [yid])

  const fromList = (location.state as { release?: Release } | null)?.release ?? null
  const preview = fromList && fromList.yummy_id === yid ? fromList : null
  const view = release ?? preview

  const dubbings = useMemo(() => {
    if (!videos) return []
    const names = unique(videos.map((v) => v.dubbing))
    const count = (n: string) => videos.filter((v) => v.dubbing === n).length
    return names.sort((a, b) => count(b) - count(a))
  }, [videos])

  const activeDub = dubbings.includes(dubbing) ? dubbing : dubbings[0]

  const players = useMemo(
    () => unique((videos ?? []).filter((v) => v.dubbing === activeDub).map((v) => v.player)),
    [videos, activeDub]
  )
  const activePlayer = players.includes(player) ? player : players[0]

  const episodes = useMemo(
    () => (videos ?? []).filter((v) => v.dubbing === activeDub && v.player === activePlayer).sort(byNumber),
    [videos, activeDub, activePlayer]
  )
  const active = episodes.find((v) => v.number === number) ?? episodes[0]

  function goToNext() {
    const idx = episodes.findIndex((v) => v.id === active?.id)
    const next = episodes[idx + 1]
    if (next) setNumber(next.number)
  }

  if (error && !view) return <p className="empty">Тайтл не найден</p>
  if (!view) return <Loader label="Загружаем..." />

  const poster = imageUrl(view.poster?.optimized?.preview || view.poster?.preview)
  const blockedInRu = view.blocked_in?.includes('RU')

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {poster && (
          <img
            src={poster}
            alt={view.name.main}
            style={{
              width: 192,
              height: 'fit-content',
              flexShrink: 0,
              borderRadius: 6,
              border: '1px solid var(--line)',
              objectFit: 'cover',
              ...({ viewTransitionName: 'poster-shared' } as unknown as CSSProperties),
            }}
          />
        )}
        <div className="stagger" style={{ minWidth: 0, flex: 1, minInlineSize: 260 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{view.name.main}</h1>
          {view.name.english && (
            <p className="mono muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
              {view.name.english}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            <span className="chip">Yummy</span>
            {view.type?.description && <span className="chip">{view.type.description}</span>}
            {view.year > 0 && <span className="chip mono">{view.year}</span>}
            {view.season?.description && <span className="chip">{view.season.description}</span>}
            {view.age_rating?.label && <span className="chip mono">{view.age_rating.label}</span>}
            {view.is_ongoing && (
              <span className="chip on">
                <span className="dot" />
                Онгоинг
              </span>
            )}
            {!!view.episodes_total && <span className="chip mono">{view.episodes_total} эп.</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <WishlistButton release={view} />
            <button
              onClick={() => window.anisav.openExternal(`https://yummyani.me/catalog/item/${view.alias}`)}
              className="btn btn-ghost btn-sm"
            >
              Открыть на Yummy
            </button>
          </div>

          {!!view.genres?.length && (
            <p className="muted" style={{ margin: '16px 0 0', fontSize: 12.5 }}>
              {view.genres.map((g) => g.name).join(' · ')}
            </p>
          )}

          {view.description && (
            <p
              style={{
                margin: '16px 0 0',
                maxWidth: 720,
                whiteSpace: 'pre-line',
                fontSize: 13.5,
                lineHeight: 1.65,
                color: 'var(--text2)',
              }}
            >
              {view.description}
            </p>
          )}
        </div>
      </div>

      {!videos && <div className="skeleton" style={{ height: 320, marginTop: 32 }} />}

      {videos && videos.length === 0 && (
        <p className="empty" style={{ marginTop: 32 }}>
          Для этого тайтла нет доступных серий
        </p>
      )}

      {active && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <select
              value={activeDub}
              onChange={(e) => setDubbing(e.target.value)}
              className="input"
              style={{ padding: '7px 10px', fontSize: 12.5 }}
            >
              {dubbings.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {players.length > 1 && (
              <select
                value={activePlayer}
                onChange={(e) => setPlayer(e.target.value)}
                className="input"
                style={{ padding: '7px 10px', fontSize: 12.5 }}
              >
                {players.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
            <span className="mono muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
              Серия {active.number}
            </span>
            <button
              onClick={goToNext}
              disabled={episodes[episodes.length - 1]?.id === active.id}
              className="btn btn-ghost btn-sm"
            >
              Следующая
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#000',
              border: '1px solid var(--line)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <iframe
              key={active.id}
              src={active.url}
              title={`${view.name.main}, серия ${active.number}`}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              referrerPolicy="origin"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>

          {blockedInRu && (
            <p className="muted" style={{ margin: '10px 0 0', fontSize: 12 }}>
              Правообладатель закрыл этот тайтл в России, плеер может не открыться без VPN.
            </p>
          )}
        </div>
      )}

      {episodes.length > 0 && (
        <section className="section" style={{ marginTop: 32 }}>
          <h2 className="section-title">
            Серии
            <span className="mono">{episodes.length}</span>
          </h2>
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 8,
            }}
          >
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setNumber(ep.number)}
                className={`ep${active?.id === ep.id ? ' on' : ''}`}
              >
                <b>Серия {ep.number}</b>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
