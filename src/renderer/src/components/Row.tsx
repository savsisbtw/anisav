import { Link } from 'react-router-dom'
import type { Release } from '../../../shared/types'
import AnimeCard from './AnimeCard'
import Reveal from './Reveal'

export default function Row({
  title,
  releases,
  to,
}: {
  title: string
  releases: Release[]
  to?: string
}) {
  if (!releases.length) return null
  return (
    <Reveal className="section">
      <h2 className="section-title">
        {title}
        <span className="mono">{releases.length}</span>
        {to && (
          <Link to={to} className="section-link">
            Все
          </Link>
        )}
      </h2>
      <div className="grid-posters">
        {releases.map((r, i) => (
          <AnimeCard key={r.id} release={r} index={i} />
        ))}
      </div>
    </Reveal>
  )
}
