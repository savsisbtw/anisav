import { Link } from 'react-router-dom'
import type { Release } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import WishlistButton from './WishlistButton'

export default function AnimeCard({ release }: { release: Release }) {
  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)
  const title = release.name.main
  const meta = [
    release.year,
    release.type?.description,
    release.episodes_total != null ? `${release.episodes_total} эп.` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link to={`/title/${release.alias || release.id}`} className="poster">
      <div className="poster-img">
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
