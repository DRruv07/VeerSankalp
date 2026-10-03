import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { leadership } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { formatDate } from "../lib/format.js"
import { careStatus, currentAssessment, dutyHours, isAttended, lastVisit } from "../lib/risk.js"
import { RiskBadge } from "../components/Ui.jsx"

export function CommanderDashboard() {
  const { user, officers, store } = useApp()
  const [query, setQuery] = useState("")
  const lead = leadership(user.unitId, store.users)
  const people = useMemo(() => {
    return officers
      .filter((officer) => officer.unitId === user.unitId)
      .map((officer) => ({ officer, assessment: currentAssessment(officer, store) }))
      .filter(({ officer }) => `${officer.full_name} ${officer.service_no} ${officer.rank_name}`.toLowerCase().includes(query.toLowerCase()))
      .sort((left, right) => right.assessment.score - left.assessment.score)
  }, [officers, query, store, user.unitId])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{lead.unit?.name}</p>
      <h1 className="mt-1 font-serif text-3xl text-pine">Officers under your command</h1>
      <p className="mt-2 text-sm text-stone-600">{user.rank} {user.name} · {people.length} officers</p>

      <article className="mt-4 rounded-xl border border-line bg-white p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Welfare officer for this unit</p>
        <p className="mt-1 font-semibold text-pine">{lead.welfare?.name}</p>
        <p className="text-stone-600">{lead.welfare?.qualification}</p>
      </article>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, service number, or rank"
        className="mt-4 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
      />

      <ul className="mt-4 space-y-3">
        {people.map(({ officer, assessment }) => {
          const visit = lastVisit(officer, store, lead.welfare?.name)
          const hours = dutyHours(officer, store)
          return (
            <li key={officer.service_no} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-pine">{officer.full_name}</h2>
                    <RiskBadge band={assessment.band} />
                    <span className="text-sm text-stone-500">{assessment.score}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {officer.service_no} · {officer.rank_name} · {officer.force_name} · {officer.deployment_record}
                  </p>
                </div>
                <Link to={`/commander/tracker/${officer.service_no}`} className="rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
                  Open record
                </Link>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Mini label="Status" value={careStatus(officer, store, assessment)} />
                <Mini label="Duty hours" value={`${hours.current} h`} />
                <Mini label="Last welfare visit" value={visit ? formatDate(visit.date) : "None"} />
                <Mini label="In care" value={isAttended(officer, store) ? "Yes" : "No"} />
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Mini({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">{label}</dt>
      <dd className="mt-1 text-stone-800">{value}</dd>
    </div>
  )
}
