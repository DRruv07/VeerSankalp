import { unitIdForForce } from "../data/units.js"
import { parseCsv } from "./csv.js"

const FILES = [
  "indian_uniform_forces",
  "workload",
  "wellness_surveys",
  "simulated_behavioral",
  "deployment_records",
  "transfers",
  "leave_history",
  "lunch_breaks",
]

export async function loadSourceDataset() {
  const tables = {}
  await Promise.all(
    FILES.map(async (name) => {
      const response = await fetch(`/data/${name}.csv`, { cache: "no-store" })
      if (!response.ok) throw new Error(`Could not read ${name}.csv`)
      tables[name] = parseCsv(await response.text())
    }),
  )

  return tables.indian_uniform_forces.map((row) => {
    const work = tables.workload.find((item) => item.service_no === row.service_no) || {}
    const wellness = tables.wellness_surveys.find((item) => item.service_no === row.service_no) || {}
    const behavior = tables.simulated_behavioral.find((item) => item.service_no === row.service_no) || {}
    const source = behavior.data_source || row.behavior_source

    return {
      ...row,
      weekly_duty_hours: work.weekly_duty_hours || row.workload,
      night_shifts_last_30_days: work.night_shifts_last_30_days || row.night_shifts_last_30_days,
      overtime_hours_last_30_days: work.overtime_hours_last_30_days || row.overtime_hours_last_30_days,
      open_assignments: work.open_assignments || row.open_assignments,
      updated_on: work.updated_on || "",
      survey_date: wellness.survey_date || "",
      stress_score: wellness.stress_score || row.stress_score,
      sleep_hours: wellness.sleep_hours || row.sleep_hours,
      mood_score: wellness.mood_score || row.mood_score,
      energy_score: wellness.energy_score || row.energy_score,
      felt_supported: wellness.felt_supported || row.felt_supported,
      alertness_score: behavior.alertness_score || row.alertness_score,
      fatigue_score: behavior.fatigue_score || row.fatigue_score,
      teamwork_score: behavior.teamwork_score || row.teamwork_score,
      punctuality_score: behavior.punctuality_score || row.punctuality_score,
      behavior_source: source,
      record_date: behavior.record_date || "",
      unitId: unitIdForForce(row.force_name),
      deployments: tables.deployment_records.filter((item) => item.service_no === row.service_no),
      transfers: tables.transfers.filter((item) => item.service_no === row.service_no),
      leaves: tables.leave_history.filter((item) => item.service_no === row.service_no),
      lunches: tables.lunch_breaks.filter((item) => item.service_no === row.service_no),
      isNew: source === "Registered",
    }
  })
}

export function mergeOfficers(source, extra) {
  const merged = new Map(source.map((officer) => [officer.service_no, officer]))
  for (const officer of extra || []) {
    if (!merged.has(officer.service_no)) merged.set(officer.service_no, officer)
  }
  return [...merged.values()]
}
