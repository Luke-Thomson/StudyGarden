const watchers = new Set()

export const state = {
  get baseUrl() {
    return localStorage.getItem('api_base') || 'http://localhost:3333'
  },
  set baseUrl(value) {
    const next = value?.trim() || 'http://localhost:3333'
    localStorage.setItem('api_base', next)
    notify()
  },
  get token() {
    return localStorage.getItem('api_token') || ''
  },
  set token(value) {
    if (value) {
      localStorage.setItem('api_token', value)
    } else {
      localStorage.removeItem('api_token')
    }
    notify()
  },
}

function notify() {
  watchers.forEach((fn) => {
    try {
      fn(state)
    } catch (error) {
      console.error('test-common state watcher error', error)
    }
  })
}

export function onStateChange(fn) {
  watchers.add(fn)
  return () => watchers.delete(fn)
}

export const $ = (id) => document.getElementById(id)

export function syncStateToInputs() {
  const base = $('baseUrl')
  if (base) base.value = state.baseUrl

  const token = $('token')
  if (token) token.value = state.token
}

export function url(path) {
  const base = state.baseUrl.replace(/\/$/, '')
  const cleaned = path.startsWith('/') ? path : `/${path}`
  return base + cleaned
}

function setStatus(code, targetId = 'statusBadge') {
  const badge = $(targetId)
  if (!badge) return

  if (!code) {
    badge.textContent = '—'
    badge.style.background = ''
    badge.style.borderColor = ''
    return
  }

  badge.textContent = `HTTP ${code}`
  const ok = code >= 200 && code < 300
  const color = ok ? '#065f46' : '#7f1d1d'
  badge.style.background = color
  badge.style.borderColor = color
}

function fmt(obj) {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (error) {
    return String(obj)
  }
}

export function renderResponse(method, fullUrl, res, data, targets = {}) {
  const methodEl = $(targets.methodId || 'lastMethod')
  if (methodEl) {
    methodEl.textContent = method
    methodEl.className = `method ${method}`
  }

  const urlEl = $(targets.urlId || 'lastUrl')
  if (urlEl) urlEl.textContent = fullUrl

  const statusCode = res?.status ?? null
  setStatus(statusCode, targets.statusId || 'statusBadge')

  const headers = {}
  if (res?.headers?.forEach) {
    res.headers.forEach((value, key) => {
      headers[key] = value
    })
  }

  const outEl = $(targets.outputId || 'out')
  if (outEl) {
    outEl.textContent = fmt({
      url: fullUrl,
      status: statusCode,
      headers,
      body: data,
    })
  }
}

export async function request(method, path, body = null, extraHeaders = {}, options = {}) {
  const fullUrl = url(path)
  const headers = { 'Content-Type': 'application/json', ...extraHeaders }
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`

  const init = { method, headers }
  if (body !== null) {
    init.body = JSON.stringify(body)
  } else if (!['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase())) {
    init.body = '{}'
  }

  try {
    const res = await fetch(fullUrl, init)
    let data
    try {
      data = await res.clone().json()
    } catch {
      data = await res.text()
    }

    if (!options.silent) {
      renderResponse(method, fullUrl, res, data, options.targets)
    }

    return { res, data }
  } catch (error) {
    const payload = { error: error?.message || 'Request failed' }
    if (!options.silent) {
      renderResponse(method, fullUrl, null, payload, options.targets)
    }
    return { res: null, data: payload }
  }
}

export function extractToken(obj) {
  if (!obj || typeof obj !== 'object') return ''
  if (obj.token) return obj.token
  if (obj.access_token) return obj.access_token
  if (obj.data && (obj.data.token || obj.data.access_token)) {
    return obj.data.token || obj.data.access_token
  }
  if (obj.meta && obj.meta.token) return obj.meta.token
  return ''
}

export function initLayout() {
  syncStateToInputs()
  onStateChange(syncStateToInputs)

  const base = $('baseUrl')
  base?.addEventListener('change', (event) => {
    state.baseUrl = event.target.value
  })

  const token = $('token')
  token?.addEventListener('change', (event) => {
    state.token = event.target.value
  })

  $('clearToken')?.addEventListener('click', () => {
    state.token = ''
  })

  $('openSwagger')?.addEventListener('click', () => window.open(url('/swagger'), '_blank'))
  $('openDocs')?.addEventListener('click', () => window.open(url('/docs'), '_blank'))

  highlightNav()
}

function highlightNav() {
  const active = document.body?.dataset?.page
  if (!active) return

  document.querySelectorAll('[data-page-link]').forEach((link) => {
    if (link.dataset.pageLink === active) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

export function formatIsoToLocal(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return value
  }
}
