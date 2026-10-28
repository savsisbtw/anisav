import type { Release, YummyVideo } from '../../../shared/types'

const INDEX_ORIGINS = ['https://anisav.savsis.xyz', 'https://ani.savsis.xyz']
const BASE = 'https://api.yani.tv'
const TOKEN = (import.meta.env.VITE_YUMMY_TOKEN as string | undefined) || ''
const TIMEOUT_MS = 8000

const SEASONS: Record<number, { value: string; description: string }> = {
  1: { value: 'winter', description: 'Зима' },
  2: { value: 'spring', description: 'Весна' },
  3: { value: 'summer', description: 'Лето' },
  4: { value: 'autumn', description: 'Осень' },
}

export const YUMMY_SORT = [
  { value: 'views', label: 'По просмотрам' },
  { value: 'year', label: 'По году' },
  { value: 'rating_counters', label: 'По числу оценок' },
  { value: 'top', label: 'По топу' },
  { value: 'title', label: 'По названию' },
]

interface YummyPoster {
  fullsize?: string
  big?: string
  medium?: string
  small?: string
}

interface YummyItem {
  anime_id: number
  anime_url: string
  title: string
  year: number
  description?: string
  poster?: YummyPoster
  type?: { name: string; alias: string }
  season?: number
  anime_status?: { alias: string }
  min_age?: { title: string; title_long: string }
  remote_ids?: { anilibria_alias?: string; shikimori_id?: number; myanimelist_id?: number }
  genres?: { id: number; title: string }[]
  other_titles?: string[]
  episodes?: { count: number; aired: number }
  blocked_in?: string[]
}

interface AniLibertyIndex {
  alias: Set<string>
  shikimori: Set<number>
  mal: Set<number>
}

let indexPromise: Promise<AniLibertyIndex | null> | null = null

async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (TOKEN) headers['X-Application'] = TOKEN
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(BASE + path, { headers, signal: ctrl.signal })
    if (!res.ok) throw new Error(`yummy ${res.status}`)
    const body = await res.json()
    return body.response as T
  } finally {
    clearTimeout(timer)
  }
}

async function loadIndex(): Promise<AniLibertyIndex | null> {
  const origins = INDEX_ORIGINS
  for (const origin of origins) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6000)
      const res = await fetch(`${origin}/index/anilibria.json`, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      const data = await res.json()
      return {
        alias: new Set<string>(data.alias),
        shikimori: new Set<number>(data.shikimori),
        mal: new Set<number>(data.mal),
      }
    } catch {
      continue
    }
  }
  return null
}

export function getIndex(): Promise<AniLibertyIndex | null> {
  if (!indexPromise) {
    indexPromise = loadIndex().then((idx) => {
      if (!idx) indexPromise = null
      return idx
    })
  }
  return indexPromise
}

export function isOnAniLiberty(item: Release, idx: AniLibertyIndex): boolean {
  const ids = item.remote
  if (!ids) return false
  if (ids.anilibria_alias && idx.alias.has(ids.anilibria_alias)) return true
  if (ids.shikimori_id && idx.shikimori.has(ids.shikimori_id)) return true
  if (ids.myanimelist_id && idx.mal.has(ids.myanimelist_id)) return true
  return false
}

function fixUrl(u?: string): string | undefined {
  if (!u || u.includes('default-poster')) return undefined
  if (u.startsWith('//')) return `https:${u}`
  if (u.startsWith('http')) return u
  return undefined
}

export function toRelease(it: YummyItem): Release {
  const full = fixUrl(it.poster?.fullsize) || fixUrl(it.poster?.big)
  const medium = fixUrl(it.poster?.medium) || fixUrl(it.poster?.big) || full
  const small = fixUrl(it.poster?.small) || medium
  return {
    id: -it.anime_id,
    yummy_id: it.anime_id,
    source: 'yummy',
    type: { value: it.type?.alias || '', description: it.type?.name || '' },
    year: it.year,
    name: { main: it.title, english: it.other_titles?.[0] ?? null, alternative: null },
    alias: it.anime_url,
    season: SEASONS[it.season || 0] || { value: '', description: '' },
    poster: { src: full, preview: medium, thumbnail: small, optimized: { src: full, preview: medium, thumbnail: small } },
    is_ongoing: it.anime_status?.alias === 'ongoing',
    age_rating: {
      value: it.min_age?.title || '',
      label: it.min_age?.title || '',
      description: it.min_age?.title_long || '',
    },
    description: it.description || null,
    episodes_total: it.episodes?.count ?? null,
    is_in_production: it.anime_status?.alias === 'ongoing',
    is_blocked_by_geo: false,
    is_blocked_by_copyrights: false,
    genres: it.genres?.map((g) => ({ id: g.id, name: g.title })),
    blocked_in: it.blocked_in,
    remote: it.remote_ids,
  }
}

export interface YummyPage {
  items: Release[]
  rawCount: number
}

export async function yummyCatalog(sort: string, offset: number, limit: number): Promise<YummyPage> {
  const rows = await get<YummyItem[]>(`/anime?limit=${limit}&offset=${offset}&sort=${sort}&sort_forward=false`)
  return { items: rows.map(toRelease), rawCount: rows.length }
}

export async function yummySearch(q: string, limit = 24): Promise<Release[]> {
  const rows = await get<YummyItem[]>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  return rows.map(toRelease)
}

export async function yummyTitle(id: number): Promise<Release> {
  const row = await get<YummyItem>(`/anime/${id}`)
  return toRelease(row)
}

export async function yummyVideos(id: number): Promise<YummyVideo[]> {
  const rows = await get<
    {
      video_id: number
      number: string
      iframe_url: string
      duration?: number
      data: { player: string; dubbing: string }
    }[]
  >(`/anime/${id}/videos`)
  return rows
    .map((v) => ({
      id: v.video_id,
      number: v.number,
      player: v.data.player.replace(/^Плеер\s+/, ''),
      dubbing: v.data.dubbing.replace(/^Озвучка\s+/, ''),
      url: v.iframe_url.startsWith('//') ? `https:${v.iframe_url}` : v.iframe_url,
      duration: v.duration || 0,
    }))
    .filter((v) => v.url.startsWith('https://'))
}

export async function onlyOnYummy(items: Release[]): Promise<Release[]> {
  const idx = await getIndex()
  if (!idx) throw new Error('aniliberty index unavailable')
  return items.filter((r) => !isOnAniLiberty(r, idx))
}
