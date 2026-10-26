import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Genre } from '../../../shared/types'
import Loader from '../components/Loader'

export default function Genres() {
  const [genres, setGenres] = useState<Genre[] | null>(null)

  useEffect(() => {
    api.genres().then(setGenres).catch(() => setGenres([]))
  }, [])

  if (!genres) return <Loader label="Загружаем жанры..." />

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Жанры</h1>
          <p>{genres.length} жанров</p>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        {genres.map((g) => (
          <Link key={g.id} to={`/catalog?genre=${g.id}`} className="tile">
            <b>{g.name}</b>
            {g.total_releases != null && <span>{g.total_releases} тайтлов</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
