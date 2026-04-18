const jsonHeaders = { 'Content-Type': 'application/json' }

const DEFAULT_TIMEOUT_MS = 20_000

export async function apiJson(path, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(path, {
      credentials: 'include',
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...jsonHeaders,
        ...(fetchOptions.headers || {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = data.error || res.statusText || '요청에 실패했습니다.'
      throw new Error(message)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}
