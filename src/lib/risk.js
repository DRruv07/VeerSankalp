import { num } from "./format.js"

export function assessOfficer(officer) {
  const stress = num(officer.stress_score)
  const sleep = num(officer.sleep_hours)
  const mood = num(officer.mood_score)
  const energy = num(officer.energy_score)
  const hours = num(officer.weekly_duty_hours)
  const nights = num(officer.night_shifts_last_30_days)
  const overtime = num(officer.overtime_hours_last_30_days)
  const assignments = num(officer.open_assignments)
  const transfers = num(officer.total_transfer || officer.transfers?.length)
  const fatigue = num(officer.fatigue_score)
  const supported = String(officer.felt_supported || "").toLowerCase() === "yes"
  const reasons = []

  const add = (points, reason) => {
    if (points > 0) reasons.push({ points, reason })
  }

  add(Math.round(((Math.min(5, Math.max(1, stress)) - 1) / 4) * 24), `Stress is ${stress} out of 5`)
  if (sleep > 0 && sleep < 6) add(Math.round(((6 - sleep) / 2) * 14), `Sleep is ${sleep} hours`)
  else if (sleep >= 6 && sleep < 7) add(4, `Sleep is ${sleep} hours`)
  add(Math.round(((5 - Math.min(5, Math.max(1, mood))) / 4) * 14), `Mood is ${mood} out of 5`)
  add(Math.round(((5 - Math.min(5, Math.max(1, energy))) / 4) * 10), `Energy is ${energy} out of 5`)
  if (!supported) add(8, "No support recorded")
  if (hours > 48) add(Math.min(12, Math.round(((hours - 48) / 12) * 12)), `Weekly duty is ${hours} hours`)
  if (nights >= 4) add(Math.min(10, Math.round((nights / 7) * 10)), `${nights} night shifts in the last 30 days`)
  if (overtime >= 8) add(Math.min(8, Math.round((overtime / 20) * 8)), `${overtime} overtime hours in the last 30 days`)
  if (assignments >= 3) add(5, `${assignments} open assignments`)
  if (transfers >= 2) add(4, `${transfers} transfers on record`)
  if (fatigue >= 45) add(Math.min(10, Math.round((fatigue / 100) * 10)), `Fatigue score is ${fatigue}`)

  const score = Math.min(100, reasons.reduce((sum, item) => sum + item.points, 0))
  return {
    score,
    band: bandFor(score),
    reasons: reasons.map((item) => item.reason),
    actions: adviceFor(officer, bandFor(score)),
    baseline: score,
  }
}

export function currentAssessment(officer, store) {
  const base = assessOfficer(officer)
  let score = base.score
  const notes = []
  if (store.visits?.[officer.service_no] || isHistoricallyInCare(officer)) {
    score = Math.max(8, score - 8)
    notes.push("Welfare follow-up is underway")
  }
  if (store.relief?.[officer.service_no]?.granted) {
    score = Math.max(8, score - 10)
    notes.push("Commander has eased the duty load")
  }
  const band = bandFor(score)
  return {
    ...base,
    score,
    band,
    baseline: base.score,
    baselineBand: base.band,
    reasons: [...base.reasons, ...notes],
    actions: adviceFor(officer, band),
  }
}

export function isHistoricallyInCare(officer) {
  return (
    !officer.isNew &&
    String(officer.felt_supported || "").toLowerCase() === "yes" &&
    num(officer.stress_score) <= 2
  )
}

export function isAttended(officer, store) {
  if (store.visits?.[officer.service_no]) return true
  return isHistoricallyInCare(officer)
}

export function lastVisit(officer, store, welfareName) {
  if (store.visits?.[officer.service_no]) return store.visits[officer.service_no]
  if (!isHistoricallyInCare(officer)) return null
  return {
    date: officer.survey_date || "2026-09-01",
    by: welfareName,
    note: "Taken from the wellness survey already on file.",
    seeded: true,
  }
}

export function careStatus(officer, store, assessment) {
  if (!isAttended(officer, store) && assessment.band === "High") return "Unattended · high risk"
  if (!isAttended(officer, store)) return "Unattended"
  if (store.relief?.[officer.service_no]?.granted) return "In care · lighter duty"
  if (assessment.score + 6 < assessment.baseline) return "Recovering"
  return "In care"
}

export function recoveryLabel(assessment) {
  if (assessment.score + 8 < assessment.baseline) return "Improving"
  if (assessment.score > assessment.baseline + 2) return "Needs attention"
  return "Holding"
}

export function dutyHours(officer, store) {
  const raw = num(officer.weekly_duty_hours)
  if (store.relief?.[officer.service_no]?.granted) {
    return { raw, current: Math.max(40, raw - 8), eased: true }
  }
  return { raw, current: raw, eased: false }
}

export function trendSeries(officer, store) {
  const base = assessOfficer(officer).score
  const seed = num(String(officer.service_no).replace(/\D/g, ""))
  const visited = Boolean(store.visits?.[officer.service_no]) || isHistoricallyInCare(officer)
  const eased = Boolean(store.relief?.[officer.service_no]?.granted)
  const labels = ["16 Aug", "23 Aug", "30 Aug", "6 Sep", "13 Sep", "20 Sep"]
  const scores = labels.map((_, index) => {
    const wobble = ((seed + index * 3) % 5) - 2
    let value = base + wobble
    if (visited && index >= 4) value -= 6
    if (eased && index === 5) value -= 8
    return Math.max(5, Math.min(98, value))
  })
  return { labels, scores }
}

export function bandFor(score) {
  if (score >= 61) return "High"
  if (score >= 36) return "Moderate"
  return "Low"
}

function adviceFor(officer, band) {
  const items = []
  if (num(officer.sleep_hours) < 6) {
    items.push("Keep a protected sleep window of at least six hours between duties.")
  }
  if (num(officer.night_shifts_last_30_days) >= 4) {
    items.push("Rotate off night shifts for the next two weeks.")
  }
  if (num(officer.weekly_duty_hours) >= 54) {
    items.push("Bring weekly duty hours down before adding new assignments.")
  }
  if (num(officer.stress_score) >= 4) {
    items.push("Book a welfare review this week rather than waiting for the next survey.")
  }
  if (String(officer.felt_supported || "").toLowerCase() !== "yes") {
    items.push("Ask the commander for a welfare officer. Support is not on record.")
  }
  if (num(officer.fatigue_score) >= 50) {
    items.push("Arrange one recovery day if the unit can cover the duty.")
  }
  if (num(officer.overtime_hours_last_30_days) >= 12) {
    items.push("Close or hand over open work before accepting more overtime.")
  }
  if (!items.length) items.push("Keep the current routine and record how the week of duty felt.")
  if (band === "High") items.push("Lighter duty is appropriate while welfare follow-up is underway.")
  return items.slice(0, 4)
}

export function riskCounts(officers, store) {
  return officers.reduce(
    (counts, officer) => {
      const band = currentAssessment(officer, store).band
      counts.total += 1
      counts[band] += 1
      return counts
    },
    { total: 0, High: 0, Moderate: 0, Low: 0 },
  )
}
