import { useMemo, useState } from "react"
import { leadership } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { currentAssessment, dutyHours, isAttended } from "../lib/risk.js"
import { Modal, PrimaryButton, RiskBadge, controlClass } from "../components/Ui.jsx"
import { Mini } from "./CommanderDashboard.jsx"

export function WelfareDashboard() {
  const { user, officers, store, attendOfficer } = useApp()
  const [query, setQuery] = useState("")
  const [target, setTarget] = useState(null)
  const [note, setNote] = useState("")
  const lead = leadership(user.unitId, store.users)

  const queue = useMemo(() => {
    return officers
      .filter((officer) => officer.unitId === user.unitId && !isAttended(officer, store))
      .map((officer) => ({ officer, assessment: currentAssessment(officer, store) }))
      .filter(({ officer }) => `${officer.full_name} ${officer.service_no}`.toLowerCase().includes(query.toLowerCase()))
      .sort((left, right) => right.assessment.score - left.assessment.score)
  }, [officers, query, store, user.unitId])

  function submitVisit(event) {
    event.preventDefault()
    attendOfficer(target.service_no, note, user.name)
    setTarget(null)
    setNote("")
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{lead.unit?.name}</p>
      <h1 className="mt-1 font-serif text-3xl text-pine">Unattended officers</h1>
      <p className="mt-2 text-sm text-stone-600">
        Sorted by mental-health risk. {user.name} · {queue.length} waiting.
      </p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the queue"
        className="mt-4 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
      />
      <ul className="mt-4 space-y-3">
        {queue.length === 0 && <li className="rounded-xl border border-line bg-white p-4 text-sm text-stone-600">Everyone in this unit is already in care. Open Tracker for recovery follow-up.</li>}
        {queue.map(({ officer, assessment }) => (
          <li key={officer.service_no} className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-pine">{officer.full_name}</h2>
                  <RiskBadge band={assessment.band} />
                  <span className="text-sm text-stone-500">{assessment.score}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{officer.service_no} · {officer.rank_name} · {officer.force_name}</p>
              </div>
              <PrimaryButton onClick={() => setTarget(officer)}>Attend</PrimaryButton>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Mini label="Stress" value={`${officer.stress_score}/5`} />
              <Mini label="Sleep" value={`${officer.sleep_hours} h`} />
              <Mini label="Duty hours" value={`${dutyHours(officer, store).current} h`} />
              <Mini label="Supported" value={officer.felt_supported} />
            </dl>
            <p className="mt-3 text-sm text-stone-700">{assessment.reasons.slice(0, 2).join(" · ")}</p>
          </li>
        ))}
      </ul>

      {target && (
        <Modal title={`Attend ${target.full_name}`} onClose={() => setTarget(null)}>
          <form onSubmit={submitVisit} className="space-y-3">
            <p className="text-sm text-stone-600">This starts regular follow-up. The note is stored on the officer’s tracking record.</p>
            <textarea className={`${controlClass} min-h-28`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you cover in this visit?" required minLength={8} />
            <PrimaryButton type="submit">Save visit</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  )
}
