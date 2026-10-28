export interface ImageObj {
  src?: string
  preview?: string
  thumbnail?: string
  optimized?: {
    src?: string
    preview?: string
    thumbnail?: string
  }
}

export interface ValueDescription {
  value: string
  description: string
}

export interface Genre {
  id: number
  name: string
  image?: ImageObj
  total_releases?: number
}

export interface AgeRating {
  value: string
  label: string
  is_adult?: boolean
  description: string
}

export interface EpisodeSkip {
  start: number
  stop: number
}

export interface Episode {
  id: string
  name: string | null
  name_english?: string | null
  ordinal: number
  opening?: EpisodeSkip | null
  ending?: EpisodeSkip | null
  preview?: ImageObj
  hls_480?: string | null
  hls_720?: string | null
  hls_1080?: string | null
  duration?: number | null
  rutube_id?: string | null
  youtube_id?: string | null
  sort_order?: number
  release_id: number
}

export interface Torrent {
  id: number
  hash: string
  size: number
  type?: ValueDescription
  color?: { value: string; description: string }
  codec?: { value: string; label: string; description: string }
  label: string
  quality?: { value: string; description: string }
  magnet: string
  filename: string
  seeders: number
  leechers: number
  bitrate?: number
  is_hardsub?: boolean
  description?: string
  created_at?: string
  updated_at?: string
  completed_times?: number
}

export interface Release {
  id: number
  type: ValueDescription
  year: number
  name: { main: string; english?: string | null; alternative?: string | null }
  alias: string
  season: ValueDescription
  poster: ImageObj
  fresh_at?: string
  created_at?: string
  updated_at?: string
  is_ongoing: boolean
  age_rating: AgeRating
  publish_day?: { value: number; description: string }
  description?: string | null
  notification?: string | null
  episodes_total: number | null
  is_in_production: boolean
  is_blocked_by_geo: boolean
  is_blocked_by_copyrights: boolean
  added_in_users_favorites?: number
  average_duration_of_episode?: number
  genres?: Genre[]
  episodes?: Episode[]
  torrents?: Torrent[]
  latest_episode?: Episode
  source?: 'yummy'
  yummy_id?: number
  blocked_in?: string[]
  remote?: { anilibria_alias?: string; shikimori_id?: number; myanimelist_id?: number }
}

export interface YummyVideo {
  id: number
  number: string
  player: string
  dubbing: string
  url: string
  duration: number
}

export interface ScheduleDay {
  release: Release
  full_season_is_released: boolean
  published_release_episode?: Episode | null
  next_release_episode_number?: number | null
}

export interface ScheduleNow {
  today: ScheduleDay[]
  tomorrow: ScheduleDay[]
  yesterday: ScheduleDay[]
}

export interface Pagination {
  total: number
  count: number
  per_page: number
  current_page: number
  total_pages: number
}

export interface CatalogResponse {
  data: Release[]
  meta: { pagination: Pagination }
}

export interface UserProfile {
  id: number
  login: string
  email?: string
  nickname: string
  avatar?: ImageObj
  is_banned?: boolean
  created_at?: string
}

export type CollectionType = 'WATCHING' | 'PLANNED' | 'WATCHED' | 'POSTPONED' | 'ABANDONED'

export interface TimecodeItem {
  release_episode_id: string
  time: number
  is_watched: boolean
}

export interface HistoryItem {
  id: number
  time: number
  is_watched: boolean
  updated_at: string
  release_episode_id: string
  release_episode: Episode
  release: Release
}

export interface CatalogFilters {
  genres?: number[]
  types?: string[]
  seasons?: string[]
  years?: { from_year?: number; to_year?: number }
  search?: string
  sorting?: string
  age_ratings?: string[]
  publish_statuses?: string[]
  production_statuses?: string[]
}
