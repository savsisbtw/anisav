import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Release } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import { isRich, openWithTransition, prefersReducedMotion, stagger } from '../lib/motion'

const SLIDE_MS = 7000

function Slide({ release, on }: { release: Release; on: boolean }) {
  const navigate = useNavigate()
  const posterRef = useRef<HTMLDivElement>(null)
  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)
  const to = `/title/${release.alias || release.id}`
  const meta = [
    release.year,
    release.type?.description,
    release.episodes_total != null ? `${release.episodes_total} эп.` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={`featured-slide${on ? ' on' : ''}`} aria-hidden={!on}>
      <div className="f-text">
        <div style={stagger(0)} className="f-label">
          <span className="chip on">
            <span className="dot" />
            {release.is_ongoing ? 'Онгоинг' : 'Новинка'}
          </span>
          <span className="mono muted" style={{ fontSize: 12 }}>
            {meta}
          </span>
        </div>
        <h2 style={stagger(1)} className="f-title">
          {release.name.main}
        </h2>
        {release.description && (
          <p style={stagger(2)} className="f-desc">
            {release.description}
          </p>
        )}
        <div style={stagger(3)}>
          <Link
            to={to}
            state={{ release }}
            tabIndex={on ? 0 : -1}
            className="btn btn-primary"
            onClick={(e) => openWithTransition(e, () => navigate(to, { state: { release } }), posterRef.current)}
          >
            Смотреть
          </Link>
        </div>
      </div>
      <div className="f-poster" ref={posterRef}>
        {poster && <img src={poster} alt={release.name.main} />}
      </div>
    </div>
  )
}

export default function Featured({ releases }: { releases: Release[] }) {
  const rotate = isRich() && !prefersReducedMotion() && releases.length > 1
  const items = rotate ? releases.slice(0, 5) : releases.slice(0, 1)
  const [index, setIndex] = useState(0)

  if (items.length === 0) return null

  function next() {
    setIndex((i) => (i + 1) % items.length)
  }

  return (
    <div className="featured">
      <div className="featured-stage">
        {items.map((release, i) => (
          <Slide key={release.id} release={release} on={i === index} />
        ))}
      </div>
      {rotate && (
        <div className="f-progress">
          {items.map((release, i) => (
            <button
              key={release.id}
              type="button"
              aria-label={`Показать: ${release.name.main}`}
              className={`f-seg${i < index ? ' done' : ''}${i === index ? ' on' : ''}`}
              onClick={() => setIndex(i)}
            >
              <i style={{ ['--dur' as string]: `${SLIDE_MS}ms` }} onAnimationEnd={i === index ? next : undefined} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
