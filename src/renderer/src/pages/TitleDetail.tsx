import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, imageUrl } from '../lib/api'
import type { Episode, Release, TimecodeItem } from '../../../shared/types'
import { useAuth } from '../lib/AuthContext'
import { getAllLocalProgress, saveLocalProgress } from '../lib/localProgress'
import Loader from '../components/Loader'
import Player from '../components/Player'
import AddToListButton from '../components/AddToListButton'
import WishlistButton from '../components/WishlistButton'

function formatBytes(n: number) {
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

export default function TitleDetail() {
  const { idOrAlias } = useParams()
  const { user } = useAuth()
  const [release, setRelease] = useState<Release | null>(null)
  const [error, setError] = useState(false)
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
  const [timecodes, setTimecodes] = useState<Map<string, TimecodeItem>>(new Map())

  useEffect(() => {
    if (!idOrAlias) return
    setRelease(null)
    setSelectedEp(null)
    api
      .release(idOrAlias)
      .then((r) => {
        setRelease(r)
        setSelectedEp(r.episodes?.[0] ?? null)
      })
      .catch(() => setError(true))
  }, [idOrAlias])

  useEffect(() => {
    const local = getAllLocalProgress()
    const merged = new Map<string, TimecodeItem>(
      Object.entries(local).map(([id, p]) => [
        id,
        { release_episode_id: id, time: p.time, is_watched: p.is_watched },
      ])
    )
    setTimecodes(merged)

    if (!user) return
    window.anisav
      .timecodes()
      .then((items: TimecodeItem[]) => {
        setTimecodes((prev) => {
          const next = new Map(prev)
          for (const i of items) next.set(i.release_episode_id, i)
          return next
        })
      })
      .catch(() => {})
  }, [user, idOrAlias])

  const poster = useMemo(
    () => imageUrl(release?.poster?.optimized?.preview || release?.poster?.preview),
    [release]
  )

  const saveTimecode = useCallback(
    (episodeId: string, time: number, isWatched: boolean) => {
      saveLocalProgress(episodeId, time, isWatched)
      if (user) window.anisav.timecodeSave(episodeId, time, isWatched).catch(() => {})
      setTimecodes((prev) => {
        const next = new Map(prev)
        next.set(episodeId, { release_episode_id: episodeId, time, is_watched: isWatched })
        return next
      })
    },
    [user]
  )

  function goToNextEpisode() {
    if (!release?.episodes || !selectedEp) return
    const idx = release.episodes.findIndex((e) => e.id === selectedEp.id)
    const next = release.episodes[idx + 1]
    if (next) setSelectedEp(next)
  }

  if (error) return <p className="empty">Тайтл не найден</p>
  if (!release) return <Loader label="Загружаем..." />

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <img
          src={poster}
          alt={release.name.main}
          style={{
            width: 192,
            height: 'fit-content',
            flexShrink: 0,
            borderRadius: 6,
            border: '1px solid var(--line)',
            objectFit: 'cover',
          }}
        />
        <div style={{ minWidth: 0, flex: 1, minInlineSize: 260 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{release.name.main}</h1>
          {release.name.english && (
            <p className="mono muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
              {release.name.english}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {release.type?.description && <span className="chip">{release.type.description}</span>}
            {release.year && <span className="chip mono">{release.year}</span>}
            {release.season?.description && <span className="chip">{release.season.description}</span>}
            {release.age_rating?.label && <span className="chip mono">{release.age_rating.label}</span>}
            {release.is_ongoing && (
              <span className="chip on">
                <span className="dot" />
                Онгоинг
              </span>
            )}
            {release.episodes_total != null && <span className="chip mono">{release.episodes_total} эп.</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <AddToListButton releaseId={release.id} />
            <WishlistButton release={release} />
          </div>

          {!!release.genres?.length && (
            <p className="muted" style={{ margin: '16px 0 0', fontSize: 12.5 }}>
              {release.genres.map((g) => g.name).join(' · ')}
            </p>
          )}

          {release.description && (
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
              {release.description}
            </p>
          )}
        </div>
      </div>

      {selectedEp && (
        <div style={{ marginTop: 32 }}>
          <Player
            episode={selectedEp}
            key={selectedEp.id}
            resumeAt={timecodes.get(selectedEp.id)?.time}
            onProgress={(t) => saveTimecode(selectedEp.id, t, false)}
            onEnded={() => {
              saveTimecode(selectedEp.id, 0, true)
              goToNextEpisode()
            }}
          />
        </div>
      )}

      {!!release.episodes?.length && (
        <section className="section" style={{ marginTop: 32 }}>
          <h2 className="section-title">
            Серии
            <span className="mono">{release.episodes.length}</span>
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 8,
            }}
          >
            {release.episodes.map((ep) => {
              const tc = timecodes.get(ep.id)
              const isSelected = selectedEp?.id === ep.id
              return (
                <button key={ep.id} onClick={() => setSelectedEp(ep)} className={`ep${isSelected ? ' on' : ''}`}>
                  <b>
                    Серия {ep.ordinal}
                    {tc?.is_watched ? ' ✓' : ''}
                  </b>
                  {ep.name && <small>{ep.name}</small>}
                  {tc && !tc.is_watched && ep.duration ? (
                    <div className="bar">
                      <i style={{ width: `${Math.min(100, (tc.time / ep.duration) * 100)}%` }} />
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {!!release.torrents?.length && (
        <section className="section">
          <h2 className="section-title">Торренты</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {release.torrents.map((t) => (
              <div key={t.id} className="row-item" style={{ justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }} className="line-clamp-2">
                    {t.label}
                  </p>
                  <p className="mono muted" style={{ margin: '3px 0 0', fontSize: 11 }}>
                    {formatBytes(t.size)} · {t.quality?.description} · {t.seeders} сидов
                  </p>
                </div>
                <button onClick={() => window.anisav.openExternal(t.magnet)} className="btn btn-ghost btn-sm">
                  Magnet
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
