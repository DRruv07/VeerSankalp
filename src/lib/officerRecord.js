import { unitIdForForce } from "../data/units.js"
import { todayIso } from "./format.js"

export function nextServiceNo(officers) {
  const max = officers.reduce((highest, officer) => {
    const value = Number(String(officer.service_no).replace(/\D/g, ""))
    return Number.isFinite(value) ? Math.max(highest, value) : highest
  }, 1000)
  return `UF-${max + 1}`
}

export function buildOfficerRecord(input, serviceNo) {
  const today = todayIso()
  const stress = Number(input.stress_score)
  const sleep = Number(input.sleep_hours)
  const nights = Number(input.night_shifts_last_30_days || 0)
  const fatigue = Math.min(95, stress * 10 + (sleep < 6 ? 15 : 0) + nights)
  const station = `${input.station_city.trim()}, ${input.posting_state}`

  return {
    service_no: serviceNo,
    full_name: input.full_name.trim(),
    force_name: input.force_name,
    rank_name: input.rank_name.trim(),
    deployment_record: station,
    posting_state: input.posting_state,
    duty_type: input.duty_type.trim(),
    deployment_start: today,
    leave_history: "None recorded",
    workload: String(input.weekly_duty_hours),
    weekly_duty_hours: String(input.weekly_duty_hours),
    night_shifts_last_30_days: String(nights),
    overtime_hours_last_30_days: String(input.overtime_hours_last_30_days || 0),
    open_assignments: String(input.open_assignments || 0),
    total_transfer: "0",
    lunch_breaks: "Not recorded",
    avg_lunch_minutes: "",
    wellness_survey: `Stress ${stress}/5 · sleep ${sleep} h`,
    stress_score: String(stress),
    sleep_hours: String(sleep),
    mood_score: String(input.mood_score),
    energy_score: String(input.energy_score),
    felt_supported: input.felt_supported,
    simulated_behavioral: `Fatigue ${fatigue}`,
    alertness_score: String(Math.max(10, 100 - fatigue)),
    fatigue_score: String(fatigue),
    teamwork_score: "70",
    punctuality_score: "70",
    behavior_source: "Registered",
    data_source: "Registered",
    survey_date: today,
    updated_on: today,
    record_date: today,
    isNew: true,
    unitId: unitIdForForce(input.force_name),
    deployments: [],
    transfers: [],
    leaves: [],
    lunches: [],
    arrived_on: today,
  }
}
