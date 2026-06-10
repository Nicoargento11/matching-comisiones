// cliente HTTP base — todas las llamadas al backend pasan por aqui
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  token?: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // El token expiró o es inválido — notificamos globalmente para que el
    // AuthContext cierre la sesión sin que cada hook deba conocer esta lógica
    window.dispatchEvent(new CustomEvent('auth:session-expired'))
  }

  if (!res.ok) {
    let mensaje: string = res.statusText;
    try {
      const cuerpo = await res.json();
      if (Array.isArray(cuerpo?.message)) {
        mensaje = cuerpo.message.join(', ');
      } else if (typeof cuerpo?.message === 'string') {
        mensaje = cuerpo.message;
      }
    } catch {
      // el cuerpo no es JSON valido, usamos res.statusText
    }
    throw new ApiError(res.status, mensaje);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, token, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, token, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, token, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, token?: string) =>
    request<T>(path, token, { method: "DELETE" }),
};
