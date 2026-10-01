import { currentAssessment, isAttended } from "./risk.js"

export function noticesFor(unitId, officers, store) {
  const stored = (store.notifications || []).filter((item) => item.unitId === unitId)
  const live = officers
    .filter((officer) => officer.unitId === unitId && !isAttended(officer, store))
    .map((officer) => {
      const assessment = currentAssessment(officer, store)
      if (assessment.band !== "High") return null
      return {
        id: `risk-${officer.service_no}`,
        unitId,
        title: `${officer.full_name} is unattended`,
        body: `${officer.rank_name} · risk ${assessment.score}`,
        at: officer.survey_date || officer.arrived_on || "2026-09-01",
        serviceNo: officer.service_no,
      }
    })
    .filter(Boolean)

  return [...stored, ...live].sort((left, right) => String(right.at).localeCompare(String(left.at)))
}
