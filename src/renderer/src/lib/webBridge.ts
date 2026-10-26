import { gatewayFetch } from './api'

const TOKEN_KEY = 'anisav:token'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(value: string, remember: boolean): void {
  try {
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value)
  } catch {}
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {}
}

let token: string | null = readToken()

async function call(path: string, method = 'GET', body?: unknown) {
  if (!token) throw new Error('Не авторизован')
  const res = await gatewayFetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Ошибка ${res.status}`)
  return data
}

function fetchProfile() {
  return call('/accounts/users/me/profile')
}

export function installWebBridge(): void {
  if (typeof window.anisav !== 'undefined') return

  window.anisav = {
    openExternal: async (url: string) => {
      if (/^magnet:/.test(url)) {
        window.location.href = url
      } else if (/^https?:\/\//.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },

    login: async (login: string, password: string, remember: boolean) => {
      const res = await gatewayFetch('/accounts/users/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.token) throw new Error(data.error || 'Неверный логин или пароль')
      token = data.token
      writeToken(data.token, remember)
      return fetchProfile()
    },

    loadSavedSession: async () => {
      if (!token) return null
      try {
        return await fetchProfile()
      } catch {
        token = null
        clearToken()
        return null
      }
    },

    logout: async () => {
      try {
        if (token) await call('/accounts/users/auth/logout', 'POST')
      } catch {}
      token = null
      clearToken()
    },

    favoritesList: (page, limit) =>
      call(`/accounts/users/me/favorites/releases?page=${page}&limit=${limit}`, 'POST', { page, limit }),
    favoriteAdd: (releaseId) => call('/accounts/users/me/favorites', 'POST', [{ release_id: releaseId }]),
    favoriteRemove: (releaseId) => call('/accounts/users/me/favorites', 'DELETE', [{ release_id: releaseId }]),

    collectionList: (typeOfCollection, page, limit) =>
      call(
        `/accounts/users/me/collections/releases?type_of_collection=${typeOfCollection}&page=${page}&limit=${limit}`
      ),
    collectionAdd: (releaseId, typeOfCollection) =>
      call('/accounts/users/me/collections', 'POST', [
        { release_id: releaseId, type_of_collection: typeOfCollection },
      ]),
    collectionRemove: (releaseId) =>
      call('/accounts/users/me/collections', 'DELETE', [{ release_id: releaseId }]),
    collectionIds: () => call('/accounts/users/me/collections/ids'),
    favoriteIds: () => call('/accounts/users/me/favorites/ids'),

    historyList: () => call('/accounts/users/me/views/history'),

    timecodes: () => call('/accounts/users/me/views/timecodes'),
    timecodeSave: (releaseEpisodeId, time, isWatched) =>
      call('/accounts/users/me/views/timecodes', 'POST', [
        { release_episode_id: releaseEpisodeId, time, is_watched: isWatched },
      ]),
  }
}
