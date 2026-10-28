import { app, BrowserWindow, ipcMain, safeStorage, session, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { GATEWAYS, fetchWithFailover } from '../shared/gateways'

app.setName('AniSav')

const isDev = !app.isPackaged

const tokenPath = join(app.getPath('userData'), 'token.bin')
const gatewayPath = join(app.getPath('userData'), 'gateway.txt')
const PLAIN_PREFIX = 'plain:'

// The Bearer token lives only here in the main process — the renderer
// never touches it directly, mirroring the savsis-mail credential model.
let token: string | null = null

function saveToken(t: string): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(tokenPath, safeStorage.encryptString(t))
  } else {
    // No OS keychain/DPAPI available on this machine — fall back to a plain
    // on-disk token rather than silently failing to remember the session.
    writeFileSync(tokenPath, PLAIN_PREFIX + t, 'utf-8')
  }
}

function loadToken(): string | null {
  if (!existsSync(tokenPath)) return null
  try {
    const raw = readFileSync(tokenPath)
    const text = raw.toString('utf-8')
    if (text.startsWith(PLAIN_PREFIX)) return text.slice(PLAIN_PREFIX.length)
    if (!safeStorage.isEncryptionAvailable()) return null
    return safeStorage.decryptString(raw)
  } catch {
    return null
  }
}

function clearToken(): void {
  if (existsSync(tokenPath)) writeFileSync(tokenPath, '')
}

function loadGateway(): number {
  try {
    const n = Number(readFileSync(gatewayPath, 'utf-8'))
    return n >= 0 && n < GATEWAYS.length ? n : 0
  } catch {
    return 0
  }
}

let gateway = loadGateway()

async function gatewayFetch(path: string, init?: RequestInit): Promise<Response> {
  const { res, index } = await fetchWithFailover(path, init, gateway)
  if (index !== gateway) {
    gateway = index
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(gatewayPath, String(index), 'utf-8')
  }
  return res
}

async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  if (!token) throw new Error('Не авторизован')
  const res = await gatewayFetch(path, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Ошибка ${res.status}`)
  return data
}

async function fetchProfile() {
  return api('/accounts/users/me/profile')
}

function registerIpc(): void {
  ipcMain.handle('shell:openExternal', async (_e, url: string) => {
    if (/^https?:\/\//.test(url) || /^magnet:/.test(url)) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle('auth:login', async (_e, login: string, password: string, remember: boolean) => {
    const res = await gatewayFetch('/accounts/users/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.token) throw new Error(data.error || 'Неверный логин или пароль')
    token = data.token
    if (remember) saveToken(data.token)
    return fetchProfile()
  })

  ipcMain.handle('auth:loadSaved', async () => {
    const saved = loadToken()
    if (!saved) return null
    token = saved
    try {
      return await fetchProfile()
    } catch {
      token = null
      clearToken()
      return null
    }
  })

  ipcMain.handle('auth:logout', async () => {
    try {
      if (token) await api('/accounts/users/auth/logout', { method: 'POST' })
    } catch {
      // best-effort — clear local state regardless
    }
    token = null
    clearToken()
  })

  ipcMain.handle('account:favoritesList', async (_e, page: number, limit: number) =>
    api(`/accounts/users/me/favorites/releases?page=${page}&limit=${limit}`, {
      method: 'POST',
      body: { page, limit },
    })
  )
  ipcMain.handle('account:favoriteAdd', async (_e, releaseId: number) =>
    api('/accounts/users/me/favorites', { method: 'POST', body: [{ release_id: releaseId }] })
  )
  ipcMain.handle('account:favoriteRemove', async (_e, releaseId: number) =>
    api('/accounts/users/me/favorites', { method: 'DELETE', body: [{ release_id: releaseId }] })
  )

  ipcMain.handle(
    'account:collectionList',
    async (_e, typeOfCollection: string, page: number, limit: number) =>
      api(
        `/accounts/users/me/collections/releases?type_of_collection=${typeOfCollection}&page=${page}&limit=${limit}`
      )
  )
  ipcMain.handle('account:collectionAdd', async (_e, releaseId: number, typeOfCollection: string) =>
    api('/accounts/users/me/collections', {
      method: 'POST',
      body: [{ release_id: releaseId, type_of_collection: typeOfCollection }],
    })
  )
  ipcMain.handle('account:collectionRemove', async (_e, releaseId: number) =>
    api('/accounts/users/me/collections', { method: 'DELETE', body: [{ release_id: releaseId }] })
  )
  ipcMain.handle('account:collectionIds', async () => api('/accounts/users/me/collections/ids'))
  ipcMain.handle('account:favoriteIds', async () => api('/accounts/users/me/favorites/ids'))

  ipcMain.handle('account:historyList', async () => api('/accounts/users/me/views/history'))

  ipcMain.handle('account:timecodes', async () => api('/accounts/users/me/views/timecodes'))
  ipcMain.handle(
    'account:timecodeSave',
    async (_e, releaseEpisodeId: string, time: number, isWatched: boolean) =>
      api('/accounts/users/me/views/timecodes', {
        method: 'POST',
        body: [{ release_episode_id: releaseEpisodeId, time, is_watched: isWatched }],
      })
  )
}

const PLAYER_URLS = [
  'https://*.yani.tv/*',
  'https://*.yummyani.me/*',
  'https://*.aksor.tv/*',
  'https://kodikplayer.com/*',
  'https://*.kodikplayer.com/*',
  'https://kodik.info/*',
  'https://*.kodik.info/*',
  'https://kodik.cc/*',
  'https://*.kodik.cc/*',
  'https://alloha.tv/*',
  'https://*.alloha.tv/*',
]

function setPlayerReferer(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: PLAYER_URLS }, (details, callback) => {
    if (details.resourceType === 'subFrame') details.requestHeaders['Referer'] = 'https://anisav.savsis.xyz/'
    callback({ requestHeaders: details.requestHeaders })
  })
}

function allowPlayerFraming(): void {
  session.defaultSession.webRequest.onHeadersReceived({ urls: PLAYER_URLS }, (details, callback) => {
    if (details.resourceType !== 'subFrame') {
      callback({})
      return
    }
    const headers = details.responseHeaders ?? {}
    for (const name of Object.keys(headers)) {
      const lower = name.toLowerCase()
      if (lower === 'x-frame-options') delete headers[name]
      if (lower === 'content-security-policy') {
        headers[name] = headers[name].map((v) => v.replace(/frame-ancestors[^;]*;?/gi, ''))
      }
    }
    callback({ responseHeaders: headers })
  })
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    title: 'AniSav',
    icon: join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  })

  win.setMenuBarVisibility(false)

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpc()
  setPlayerReferer()
  allowPlayerFraming()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (e) => e.preventDefault())
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})
