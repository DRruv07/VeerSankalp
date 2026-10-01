import { UNITS } from "../data/units.js"

const RESERVED = new Set([
  "admin",
  ...UNITS.flatMap((unit) => [unit.commander.username, unit.welfare.username]),
])

export function isReservedUsername(username) {
  return RESERVED.has(username.trim().toLowerCase())
}

export function publicUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export function authenticate(username, password, officers, store) {
  const id = username.trim()
  const key = id.toLowerCase()

  if (key === "admin" && password === "admin123") {
    return {
      username: "admin",
      role: "ADMIN",
      name: "System Admin",
      title: "Dataset administrator",
    }
  }

  const registered = (store.users || []).find((user) => user.username.toLowerCase() === key)
  if (registered) {
    if (registered.password !== password) return null
    return publicUser(registered)
  }

  const command = UNITS.find((unit) => unit.commander.username.toLowerCase() === key)
  if (command && password === "commander123") {
    return {
      username: command.commander.username,
      role: "COMMANDER",
      name: command.commander.name,
      rank: command.commander.rank,
      unitId: command.id,
    }
  }

  const welfare = UNITS.find((unit) => unit.welfare.username.toLowerCase() === key)
  if (welfare && password === "welfare123") {
    return {
      username: welfare.welfare.username,
      role: "WELFARE",
      name: welfare.welfare.name,
      qualification: welfare.welfare.qualification,
      unitId: welfare.id,
    }
  }

  const officer = officers.find(
    (person) =>
      person.service_no.toLowerCase() === key || person.full_name.toLowerCase() === key,
  )
  if (officer && password === "officer123") {
    return {
      username: officer.service_no,
      role: "OFFICER",
      name: officer.full_name,
      serviceNo: officer.service_no,
      unitId: officer.unitId,
      rank: officer.rank_name,
      force: officer.force_name,
    }
  }

  return null
}

export function homePath(role) {
  if (role === "ADMIN") return "/admin"
  if (role === "COMMANDER") return "/commander"
  if (role === "WELFARE") return "/welfare"
  return "/officer"
}
