export const GATEWAYS = [
  'https://api.savsis.xyz/api/anilibria',
  'https://ani.savsis.xyz/api/anilibria',
  'https://anisav.savsis.xyz/api/anilibria',
]

const TIMEOUT_MS = 5000

export async function fetchWithFailover(
  path: string,
  init: RequestInit | undefined,
  start: number
): Promise<{ res: Response; index: number }> {
  let lastError: unknown = new Error('Нет доступных серверов')
  let lastResponse: Response | null = null
  let lastIndex = start

  for (let i = 0; i < GATEWAYS.length; i++) {
    const index = (start + i) % GATEWAYS.length
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${GATEWAYS[index]}/api/v1${path}`, {
        ...init,
        signal: controller.signal,
      })
      if (res.status < 500) return { res, index }
      lastResponse = res
      lastIndex = index
    } catch (e) {
      lastError = e
    } finally {
      clearTimeout(timer)
    }
  }

  if (lastResponse) return { res: lastResponse, index: lastIndex }
  throw lastError
}
