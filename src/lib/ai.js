import axios from "axios"

const cache = new Map()

export function localView(assessment, role, roster) {
  const headline = {
    OFFICER: "What your record is showing",
    WELFARE: "Follow-up view",
    COMMANDER: "Unit leadership view",
    ADMIN: "Dataset brief",
  }[role] || "Risk view"

  const summary = roster
    ? `${roster.total} officers are in the working copy. ${roster.High} are high risk, ${roster.Moderate} moderate, and ${roster.Low} low.`
    : `${assessment.reasons.slice(0, 3).join(". ")}.`

  return {
    ok: false,
    fallback: true,
    headline,
    summary,
    actions: assessment?.actions || [],
    band: assessment?.band,
    score: assessment?.score,
    message: "Add GEMINI_API_KEY to frontend/.env and restart the app for a Gemini view.",
  }
}

function slimOfficer(officer) {
  if (!officer) return null
  return {
    service_no: officer.service_no,
    full_name: officer.full_name,
    force_name: officer.force_name,
    rank_name: officer.rank_name,
    posting_state: officer.posting_state,
    duty_type: officer.duty_type,
    weekly_duty_hours: officer.weekly_duty_hours,
    night_shifts_last_30_days: officer.night_shifts_last_30_days,
    overtime_hours_last_30_days: officer.overtime_hours_last_30_days,
    open_assignments: officer.open_assignments,
    total_transfer: officer.total_transfer,
    stress_score: officer.stress_score,
    sleep_hours: officer.sleep_hours,
    mood_score: officer.mood_score,
    energy_score: officer.energy_score,
    felt_supported: officer.felt_supported,
    fatigue_score: officer.fatigue_score,
    alertness_score: officer.alertness_score,
  }
}

export async function requestRiskView(payload) {
  const local = localView(payload.assessment, payload.role, payload.roster)
  const key = JSON.stringify({
    role: payload.role,
    mode: payload.mode || "person",
    id: payload.officer?.service_no,
    score: payload.assessment?.score,
    total: payload.roster?.total,
  })
  if (!cache.has(key)) {
    cache.set(
      key,
      axios
        .post("/api/ai/risk", {
          ...payload,
          officer: slimOfficer(payload.officer),
        })
        .then(({ data }) => {
          if (!data?.ok) return { ...local, message: data?.message || local.message }
          return {
            ok: true,
            headline: data.headline || local.headline,
            summary: data.summary || local.summary,
            actions: Array.isArray(data.actions) && data.actions.length ? data.actions : local.actions,
            band: payload.assessment?.band,
            score: payload.assessment?.score,
          }
        })
        .catch(() => ({
          ...local,
          message: "Gemini could not be reached. This reading is from the officer record.",
        })),
    )
  }
  return cache.get(key)
}
