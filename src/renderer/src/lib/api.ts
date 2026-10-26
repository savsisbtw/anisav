import type {
  CatalogFilters,
  CatalogResponse,
  Episode,
  Genre,
  Release,
  ScheduleDay,
  ScheduleNow,
  ValueDescription,
} from '../../../shared/types'
import { GATEWAYS, fetchWithFailover } from '../../../shared/gateways'

const STORAGE_KEY = 'gateway'

function loadActive(): number {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    return n >= 0 && n < GATEWAYS.length ? n : 0
  } catch {
    return 0
  }
}

let active = loadActive()

function setActive(index: number): void {
  if (index === active) return
  active = index
  try {
    localStorage.setItem(STORAGE_KEY, String(index))
  } catch {}
}

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${GATEWAYS[active]}${path}`
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const { res, index } = await fetchWithFailover(path, init, active)
  setActive(index)
  if (!res.ok) {
    throw new Error(`AniLiberty API ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  latest: (limit = 14) => req<Release[]>(`/anime/releases/latest?limit=${limit}`),
  random: (limit = 5) => req<Release[]>(`/anime/releases/random?limit=${limit}`),
  recommended: (limit = 10, releaseId?: number) =>
    req<Release[]>(
      `/anime/releases/recommended?limit=${limit}${releaseId ? `&release_id=${releaseId}` : ''}`
    ),
  scheduleWeek: () => req<ScheduleDay[]>('/anime/schedule/week'),
  scheduleNow: () => req<ScheduleNow>('/anime/schedule/now'),

  genres: () => req<Genre[]>('/anime/genres'),
  genreReleases: (genreId: number, page = 1, limit = 24) =>
    req<CatalogResponse>(`/anime/genres/${genreId}/releases?page=${page}&limit=${limit}`),

  release: (idOrAlias: string | number) => req<Release>(`/anime/releases/${idOrAlias}`),

  episode: (releaseEpisodeId: string) =>
    req<Episode & { release: Release }>(`/anime/releases/episodes/${releaseEpisodeId}`),

  search: (query: string) =>
    req<Release[]>(`/app/search/releases?query=${encodeURIComponent(query)}`),

  catalog: (filters: CatalogFilters, page = 1, limit = 24) =>
    req<CatalogResponse>('/anime/catalog/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, limit, f: filters }),
    }),

  refGenres: () => req<Genre[]>('/anime/catalog/references/genres'),
  refTypes: () => req<ValueDescription[]>('/anime/catalog/references/types'),
  refYears: () => req<number[]>('/anime/catalog/references/years'),
  refSorting: () =>
    req<Array<ValueDescription & { label: string }>>('/anime/catalog/references/sorting'),
  refAgeRatings: () =>
    req<Array<ValueDescription & { label: string }>>('/anime/catalog/references/age-ratings'),
  refSeasons: () => req<ValueDescription[]>('/anime/catalog/references/seasons'),
}
