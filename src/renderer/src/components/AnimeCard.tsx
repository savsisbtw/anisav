import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Release } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import { openWithTransition, stagger, useTilt } from '../lib/motion'
import WishlistButton from './WishlistButton'

export default function AnimeCard({ release, index = 0 }: { release: Release; index?: number }) {
  const navigate = useNavigate()
  const posterRef = useRef<HTMLDivElement>(null)
  useTilt(posterRef)

  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)
  const title = release.name.main
  const to = `/title/${release.alias || release.id}`
  const meta = [
    release.year,
    release.type?.description,
    release.episodes_total != null ? `${release.episodes_total} эп.` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      to={to}
      state={{ release }}
      className="poster"
      style={stagger(index)}
      onClick={(e) => openWithTransition(e, () => navigate(to, { state: { release } }), posterRef.current)}
    >
      <div className="poster-img" ref={posterRef}>
        {poster && <img src={poster} alt={title} loading="lazy" />}
        <div className="poster-fav">
          <WishlistButton release={release} size="sm" />
        </div>
      </div>
      <p className="poster-title line-clamp-2">{title}</p>
      <p className="poster-meta">
        {release.is_ongoing && <span className="dot" title="Онгоинг" style={{ color: '#fff' }} />}
        {meta}
      </p>
    </Link>
  )
}
