export async function apiJson(path, { method = 'GET', body } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || data.message || res.statusText
    throw new Error(typeof msg === 'string' ? msg : '요청에 실패했습니다.')
  }
  return data
}
