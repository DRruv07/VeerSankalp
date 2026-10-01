import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { AppContext } from "./app-context.js"
import { authenticate, homePath, isReservedUsername, publicUser } from "../lib/auth.js"
import { loadSourceDataset, mergeOfficers } from "../lib/dataset.js"
import { todayIso } from "../lib/format.js"
import { buildOfficerRecord, nextServiceNo } from "../lib/officerRecord.js"
import { currentAssessment, riskCounts } from "../lib/risk.js"
import { requestRiskView } from "../lib/ai.js"
import { loadSession, loadStore, saveSession, saveStore } from "../lib/store.js"

export function AppProvider({ children }) {
  const [source, setSource] = useState([])
  const [store, setStore] = useState(() => loadStore())
  const [user, setUser] = useState(() => loadSession())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadSourceDataset()
      .then(setSource)
      .catch((loadError) => setError(loadError.message || "The officer files could not be read."))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (ready) saveStore(store)
  }, [store, ready])

  const officers = useMemo(
    () => mergeOfficers(source, store.extraOfficers),
    [source, store.extraOfficers],
  )

  function commit(recipe) {
    setStore((current) => recipe(current))
  }

  function login(username, password) {
    const found = authenticate(username, password, officers, store)
    if (!found) {
      return { ok: false, message: "Those sign-in details do not match a VeerSankalp account." }
    }
    setUser(found)
    saveSession(found)
    return { ok: true, user: found }
  }

  function logout() {
    setUser(null)
    saveSession(null)
  }

  async function allowDataset() {
    const counts = riskCounts(officers, store)
    const assessment = {
      score: counts.High,
      band: counts.High > 0 ? "High" : "Low",
      reasons: [
        `${counts.total} officers copied into the working set`,
        `${counts.High} high risk`,
        `${counts.Moderate} moderate`,
        `${counts.Low} low`,
      ],
      actions: ["Review new arrivals in the table", "Keep checkup notes in the app database"],
    }
    const brief = await requestRiskView({
      mode: "import",
      role: "ADMIN",
      assessment,
      roster: counts,
      officer: { service_no: "ROSTER", full_name: "Officer dataset" },
    })
    commit((current) => ({
      ...current,
      allowed: true,
      importedAt: new Date().toISOString(),
      brief,
    }))
    return brief
  }

  function revokeDataset() {
    commit((current) => ({ ...current, allowed: false }))
  }

  async function register(form) {
    const username = form.username.trim()
    const taken =
      isReservedUsername(username) ||
      store.users.some((item) => item.username.toLowerCase() === username.toLowerCase()) ||
      officers.some((officer) => officer.service_no.toLowerCase() === username.toLowerCase())
    if (taken) throw new Error("That user ID is already in use. Choose another.")

    if (form.role === "OFFICER") {
      const serviceNo = nextServiceNo(officers)
      const record = buildOfficerRecord(form, serviceNo)
      let message = "Saved in the app database."
      try {
        const { data } = await axios.post("/api/dataset/officer", record)
        message = data.message || message
      } catch (saveError) {
        message = saveError.response?.data?.message || "Saved in the app. The original dataset file could not be updated."
      }
      const assessment = currentAssessment(record, store)
      const profile = {
        username,
        password: form.password,
        role: "OFFICER",
        name: record.full_name,
        serviceNo,
        unitId: record.unitId,
        rank: record.rank_name,
        force: record.force_name,
      }
      commit((current) => ({
        ...current,
        extraOfficers: [...current.extraOfficers, record],
        users: [...current.users, profile],
        notifications: [
          {
            id: `arrive-${serviceNo}`,
            unitId: record.unitId,
            title: `New officer ${record.full_name}`,
            body: `${serviceNo} · ${record.force_name}. Current risk is ${assessment.band}.`,
            at: new Date().toISOString(),
            serviceNo,
          },
          ...current.notifications,
        ],
      }))
      const session = publicUser(profile)
      setUser(session)
      saveSession(session)
      return { message, serviceNo }
    }

    const profile = {
      username,
      password: form.password,
      role: form.role,
      name: form.full_name.trim(),
      unitId: form.unitId || "",
      rank: form.rank_name?.trim() || "",
      qualification: form.qualification?.trim() || "",
      title: form.title?.trim() || "",
      force: form.force_name || "",
    }
    commit((current) => ({ ...current, users: [...current.users, profile] }))
    const session = publicUser(profile)
    setUser(session)
    saveSession(session)
    return { message: "Account created." }
  }

  function saveJournal(serviceNo, text) {
    const entry = { text: text.trim(), at: new Date().toISOString() }
    commit((current) => ({
      ...current,
      journals: {
        ...current.journals,
        [serviceNo]: [entry, ...(current.journals[serviceNo] || [])],
      },
    }))
  }

  function setSupport(serviceNo, answer) {
    commit((current) => ({
      ...current,
      support: { ...current.support, [serviceNo]: answer },
    }))
  }

  function submitFeedback(payload) {
    const item = { ...payload, at: new Date().toISOString(), id: `fb-${Date.now()}` }
    commit((current) => ({
      ...current,
      feedback: [item, ...current.feedback],
      support: { ...current.support, [payload.serviceNo]: "Yes" },
      notifications: [
        {
          id: item.id,
          unitId: payload.unitId,
          title: `Feedback from ${payload.name}`,
          body: payload.supportReceived,
          at: item.at,
          serviceNo: payload.serviceNo,
        },
        ...current.notifications,
      ],
    }))
  }

  function attendOfficer(serviceNo, note, by) {
    commit((current) => ({
      ...current,
      visits: {
        ...current.visits,
        [serviceNo]: { date: todayIso(), note: note.trim(), by, seeded: false },
      },
    }))
  }

  function grantRelief(serviceNo, by) {
    commit((current) => ({
      ...current,
      relief: {
        ...current.relief,
        [serviceNo]: { granted: true, date: todayIso(), by },
      },
    }))
  }

  function markNoticesRead(ids) {
    commit((current) => ({
      ...current,
      readIds: [...new Set([...(current.readIds || []), ...ids])],
    }))
  }

  const value = {
    ready,
    error,
    user,
    store,
    officers,
    datasetReady: store.allowed,
    login,
    logout,
    register,
    allowDataset,
    revokeDataset,
    saveJournal,
    setSupport,
    submitFeedback,
    attendOfficer,
    grantRelief,
    markNoticesRead,
    homePath,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
