import { useEffect, useRef, useState } from 'react'
import type { Release } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import { GridSkeleton } from '../components/Skeleton'
import { YUMMY_SORT, onlyOnYummy, yummyCatalog } from '../lib/yummy'

const PAGE = 36
const MIN_NEW = 18
const MAX_REQUESTS = 4

export default function Yummy() {
  const [sort, setSort] = useState('views')
  const [items, setItems] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(false)
  const offset = useRef(0)
  const token = useRef(0)

  async function load(reset: boolean) {
    const mine = ++token.current
    if (reset) {
      offset.current = 0
      setItems([])
      setHasMore(true)
    }
    setLoading(true)
    setError(false)
    let found: Release[] = []
    let more = true
    try {
      for (let i = 0; i < MAX_REQUESTS && found.length < MIN_NEW && more; i++) {
        const page = await yummyCatalog(sort, offset.current, PAGE)
        if (mine !== token.current) return
        offset.current += page.rawCount
        more = page.rawCount === PAGE
        found = found.concat(await onlyOnYummy(page.items))
      }
    } catch {
      if (mine === token.current) setError(true)
    }
    if (mine !== token.current) return
    setItems((prev) => {
      const seen = new Set(prev.map((r) => r.id))
      return prev.concat(found.filter((r) => !seen.has(r.id)))
    })
    setHasMore(more)
    setLoading(false)
  }

  useEffect(() => {
    load(true)
  }, [sort])

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Yummy</h1>
          <p>Тайтлы, которых нет на AniLiberty</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input"
          style={{ padding: '7px 10px', fontSize: 12.5 }}
        >
          {YUMMY_SORT.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {items.length > 0 && (
        <div className="grid-posters">
          {items.map((r, i) => (
            <AnimeCard key={r.id} release={r} index={i % 24} />
          ))}
        </div>
      )}

      {loading && <GridSkeleton count={items.length ? 6 : 18} />}

      {!loading && error && items.length === 0 && <p className="empty">Yummy сейчас не отвечает</p>}
      {!loading && !error && items.length === 0 && <p className="empty">Ничего не найдено</p>}

      {!loading && hasMore && items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button onClick={() => load(false)} className="btn btn-ghost btn-sm">
            {error ? 'Повторить' : 'Ещё'}
          </button>
        </div>
      )}
    </div>
  )
}
