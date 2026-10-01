import { useEffect, useState } from "react"
import { requestRiskView } from "../lib/ai.js"

export function useRiskView({ officer, role, assessment, roster }) {
  const [view, setView] = useState(null)
  const [loading, setLoading] = useState(false)
  const token = officer
    ? `${officer.service_no}|${role}|${assessment?.score}|${roster?.total || ""}`
    : ""

  useEffect(() => {
    if (!officer || !assessment) return undefined
    let live = true
    setLoading(true)
    requestRiskView({ officer, role, assessment, roster, mode: roster ? "import" : "person" })
      .then((next) => {
        if (live) setView(next)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [token])

  return { view, loading }
}
