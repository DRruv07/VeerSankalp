const STORE_KEY = "veersankalp.v1"
const SESSION_KEY = "veersankalp.session"

export function emptyStore() {
  return {
    allowed: false,
    importedAt: null,
    brief: null,
    extraOfficers: [],
    users: [],
    visits: {},
    relief: {},
    journals: {},
    support: {},
    feedback: [],
    notifications: [],
    readIds: [],
  }
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return emptyStore()
    return { ...emptyStore(), ...JSON.parse(raw) }
  } catch {
    return emptyStore()
  }
}

export function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")
  } catch {
    return null
  }
}

export function saveSession(user) {
  if (!user) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}
