import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { CatalogFilters, Genre, Release, ValueDescription } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import { GridSkeleton } from '../components/Skeleton'

type SortOpt = ValueDescription & { label: string }

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const searchQ = params.get('search') || ''
  const genreQ = params.get('genre')

  const [refGenres, setRefGenres] = useState<Genre[]>([])
  const [refTypes, setRefTypes] = useState<ValueDescription[]>([])
  const [refSeasons, setRefSeasons] = useState<ValueDescription[]>([])
  const [refSorting, setRefSorting] = useState<SortOpt[]>([])

  const [selectedGenres, setSelectedGenres] = useState<number[]>(genreQ ? [Number(genreQ)] : [])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [sorting, setSorting] = useState('FRESH_AT_DESC')
  const [page, setPage] = useState(1)

  const [results, setResults] = useState<Release[] | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.refGenres().then(setRefGenres).catch(() => {})
    api.refTypes().then(setRefTypes).catch(() => {})
    api.refSeasons().then(setRefSeasons).catch(() => {})
    api.refSorting().then(setRefSorting).catch(() => {})
  }, [])

  useEffect(() => {
    if (genreQ) setSelectedGenres([Number(genreQ)])
  }, [genreQ])

  const filters: CatalogFilters = useMemo(
    () => ({
      genres: selectedGenres.length ? selectedGenres : undefined,
      types: selectedTypes.length ? selectedTypes : undefined,
      seasons: selectedSeasons.length ? selectedSeasons : undefined,
      search: searchQ || undefined,
      sorting,
    }),
    [selectedGenres, selectedTypes, selectedSeasons, searchQ, sorting]
  )

  useEffect(() => {
    setLoading(true)
    setResults(null)
    if (searchQ) {
      api
        .search(searchQ)
        .then((data) => {
          setResults(data)
          setTotalPages(1)
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
      return
    }
    api
      .catalog(filters, page, 24)
      .then((res) => {
        setResults(res.data)
        setTotalPages(res.meta.pagination.total_pages)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [filters, page, searchQ])

  function toggle(list: number[], value: number, set: (v: number[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    setPage(1)
  }
  function toggleStr(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    setPage(1)
  }

  const hasFilters = selectedGenres.length > 0 || selectedTypes.length > 0 || selectedSeasons.length > 0

  return (
    <div>
      <div className="ph">
        <div>
          <h1>{searchQ ? `Поиск: ${searchQ}` : 'Каталог'}</h1>
          <p>{searchQ ? 'Результаты по запросу' : 'Фильтры слева, сортировка по умолчанию: свежие'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {!searchQ && (
          <aside style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <FilterGroup title="Сортировка">
              <select
                value={sorting}
                onChange={(e) => {
                  setSorting(e.target.value)
                  setPage(1)
                }}
                className="input"
                style={{ width: '100%', padding: '7px 10px', fontSize: 12.5 }}
              >
                {refSorting.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup title="Тип">
              {refTypes.map((t) => (
                <Check
                  key={t.value}
                  label={t.description}
                  checked={selectedTypes.includes(t.value)}
                  onChange={() => toggleStr(selectedTypes, t.value, setSelectedTypes)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Сезон">
              {refSeasons.map((s) => (
                <Check
                  key={s.value}
                  label={s.description}
                  checked={selectedSeasons.includes(s.value)}
                  onChange={() => toggleStr(selectedSeasons, s.value, setSelectedSeasons)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Жанры">
              <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                {refGenres.map((g) => (
                  <Check
                    key={g.id}
                    label={g.name}
                    checked={selectedGenres.includes(g.id)}
                    onChange={() => toggle(selectedGenres, g.id, setSelectedGenres)}
                  />
                ))}
              </div>
            </FilterGroup>

            {hasFilters && (
              <button
                onClick={() => {
                  setSelectedGenres([])
                  setSelectedTypes([])
                  setSelectedSeasons([])
                  setParams({})
                  setPage(1)
                }}
                className="btn btn-ghost btn-sm"
              >
                Сбросить фильтры
              </button>
            )}
          </aside>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && <GridSkeleton count={18} />}
          {!loading && results && results.length === 0 && <p className="empty">Ничего не найдено</p>}
          {!loading && results && results.length > 0 && (
            <>
              <div className="grid-posters fade-in">
                {results.map((r) => (
                  <AnimeCard key={r.id} release={r} />
                ))}
              </div>

              {!searchQ && totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost btn-sm">
                    Назад
                  </button>
                  <span className="mono muted" style={{ fontSize: 12 }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-ghost btn-sm"
                  >
                    Далее
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{title}</div>
      {children}
    </div>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 0',
        cursor: 'pointer',
        fontSize: 12.5,
        color: checked ? 'var(--text)' : 'var(--text2)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}
