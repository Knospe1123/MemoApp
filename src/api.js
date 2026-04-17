export async function apiJson(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  try {
    const res = await fetch(path, options)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data.error || data.message || res.statusText
      throw new Error(typeof msg === 'string' ? msg : '요청에 실패했습니다.')
    }
    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
