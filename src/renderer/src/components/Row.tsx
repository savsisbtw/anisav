import type { Release } from '../../../shared/types'
import AnimeCard from './AnimeCard'

export default function Row({ title, releases }: { title: string; releases: Release[] }) {
  if (!releases.length) return null
  return (
    <section className="section">
      <h2 className="section-title">
        {title}
        <span className="mono">{releases.length}</span>
      </h2>
      <div className="grid-posters">
        {releases.map((r) => (
          <AnimeCard key={r.id} release={r} />
        ))}
      </div>
    </section>
  )
}
