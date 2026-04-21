// cliente HTTP base — todas las llamadas al backend pasan por aqui
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

async function request<T>(path: string, token?: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const mensaje = await res.text().catch(() => res.statusText)
    throw new Error(`[${res.status}] ${path}: ${mensaje}`)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, token?: string)                        => request<T>(path, token),
  post:   <T>(path: string, body: unknown, token?: string)         => request<T>(path, token, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown, token?: string)         => request<T>(path, token, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown, token?: string)         => request<T>(path, token, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string, token?: string)                        => request<T>(path, token, { method: 'DELETE' }),
}
