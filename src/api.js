const jsonHeaders = { 'Content-Type': 'application/json' }

export async function apiJson(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...jsonHeaders,
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.error || res.statusText || '요청에 실패했습니다.'
    throw new Error(message)
  }
  return data
}
