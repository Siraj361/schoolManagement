const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '')

let activeApiRequests = 0
const apiLoadingSubscribers = new Set()

const notifyApiLoadingSubscribers = () => {
  apiLoadingSubscribers.forEach((subscriber) => subscriber())
}

export const subscribeToApiLoading = (subscriber) => {
  apiLoadingSubscribers.add(subscriber)
  return () => apiLoadingSubscribers.delete(subscriber)
}

export const isApiLoading = () => activeApiRequests > 0

function startApiRequest() {
  let finished = false
  activeApiRequests += 1
  if (activeApiRequests === 1) notifyApiLoadingSubscribers()
  return () => {
    if (finished) return
    finished = true
    activeApiRequests = Math.max(0, activeApiRequests - 1)
    if (activeApiRequests === 0) notifyApiLoadingSubscribers()
  }
}

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) }
  const token = localStorage.getItem('prime_access_token')
  if (token) headers.Authorization = `Bearer ${token}`
  const finishLoading = startApiRequest()
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error?.message || 'Request failed')
    return payload
  } finally {
    finishLoading()
  }
}

export const apiGet = (path) => apiRequest(path)
export const apiPost = (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) })
export const apiPatch = (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiUpload = (path, formData) => apiRequest(path, { method: 'POST', body: formData, headers: {} })
export const apiUpdateUpload = (path, formData) => apiRequest(path, { method: 'PATCH', body: formData, headers: {} })
export const apiAssetUrl = (assetPath) => assetPath?.startsWith('http') ? assetPath : `${API_ORIGIN}${assetPath || ''}`
export const apiLogin = (email, password) => apiPost('/auth/login', { email, password })
export const apiDownload = async (path) => {
  const token = localStorage.getItem('prime_access_token')
  const finishLoading = startApiRequest()
  try {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error('Download failed')
    return await response.blob()
  } finally {
    finishLoading()
  }
}
export const apiModulePath = (path) => {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'academics') return parts.slice(0, 3).join('-')
  return parts.slice(0, 2).join('-')
}
