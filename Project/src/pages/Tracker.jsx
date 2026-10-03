import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { leadership } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { formatDate, num } from "../lib/format.js"
import { useRiskView } from "../lib/useRiskView.js"
import {
  careStatus,
  currentAssessment,
  dutyHours,
  isAttended,
  lastVisit,
  recoveryLabel,
  trendSeries,
} from "../lib/risk.js"
import { TrendChart } from "../components/Charts.jsx"
import { AiNote, PrimaryButton, RiskBadge } from "../components/Ui.jsx"
import { Mini } from "./CommanderDashboard.jsx"

export function CommanderTracker() {
  return <Tracker role="COMMANDER" />
}

export function WelfareTracker() {
  return <Tracker role="WELFARE" />
}

function Tracker({ role }) {
  const { serviceNo } = useParams()
  const { user, officers, store, grantRelief } = useApp()
  const lead = leadership(user.unitId, store.users)
  const pool = officers.filter((officer) => officer.unitId === user.unitId)
  const list = pool.filter((officer) => (role === "WELFARE" ? isAttended(officer, store) : true))
  const selected = list.find((officer) => officer.service_no === serviceNo)
  const base = role === "COMMANDER" ? "/commander/tracker" : "/welfare/tracker"

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[18rem_1fr]">
      <aside>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Tracker</p>
        <h1 className="mt-1 font-serif text-2xl text-pine">{role === "WELFARE" ? "Officers in care" : "Unit tracking"}</h1>
        <ul className="mt-3 space-y-2">
          {list.length === 0 && <li className="text-sm text-stone-600">No officers in this view yet.</li>}
          {list
            .map((officer) => ({ officer, assessment: currentAssessment(officer, store) }))
            .sort((left, right) => right.assessment.score - left.assessment.score)
            .map(({ officer, assessment }) => (
              <li key={officer.service_no}>
                <Link
                  to={`${base}/${officer.service_no}`}
                  className={`block rounded-lg border px-3 py-2 text-sm ${selected?.service_no === officer.service_no ? "border-pine bg-white" : "border-line bg-white/70"}`}
                >
                  <span className="font-semibold text-pine">{officer.full_name}</span>
                  <span className="mt-1 flex items-center gap-2 text-stone-600">
                    <RiskBadge band={assessment.band} /> {assessment.score}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </aside>
      <section>
        {!selected && <p className="rounded-xl border border-line bg-white p-4 text-sm text-stone-600">Choose an officer to open the tracking record.</p>}
        {selected && (
          <Record
            key={selected.service_no}
            officer={selected}
            role={role}
            store={store}
            lead={lead}
            onRelief={() => grantRelief(selected.service_no, user.name)}
          />
        )}
      </section>
    </div>
  )
}

function Record({ officer, role, store, lead, onRelief }) {
  const assessment = currentAssessment(officer, store)
  const { view, loading } = useRiskView({ officer, role, assessment })
  const visit = lastVisit(officer, store, lead.welfare?.name)
  const hours = dutyHours(officer, store)
  const journals = store.journals[officer.service_no] || []
  const skipped = (officer.lunches || []).filter((item) => item.skipped === "Yes").length
  const relief = store.relief[officer.service_no]
  const [done, setDone] = useState(Boolean(relief?.granted))

  return (
    <article className="space-y-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-3xl text-pine">{officer.full_name}</h2>
        <RiskBadge band={assessment.band} />
      </div>
      <p className="text-sm text-stone-600">
        {officer.service_no} · {officer.rank_name} · {officer.force_name} · {officer.duty_type}
      </p>
      <AiNote view={view} loading={loading} />
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Mini label="Status" value={careStatus(officer, store, assessment)} />
        <Mini label="Recovery" value={recoveryLabel(assessment)} />
        <Mini label="Last welfare visit" value={visit ? `${formatDate(visit.date)} · ${visit.by}` : "None"} />
        <Mini label="Working hours" value={`${hours.current} h / week`} />
        <Mini label="Night shifts" value={officer.night_shifts_last_30_days} />
        <Mini label="Overtime" value={`${officer.overtime_hours_last_30_days} h`} />
        <Mini label="Open work" value={officer.open_assignments} />
        <Mini label="Transfers" value={String(officer.transfers?.length || num(officer.total_transfer))} />
        <Mini label="Leave spells" value={String(officer.leaves?.length || 0)} />
      </dl>
      {visit?.note && <p className="text-sm text-stone-700">Latest visit note: {visit.note}</p>}
      <div>
        <h3 className="font-serif text-xl text-pine">Workload tracking</h3>
        <div className="mt-2 h-48">
          <TrendChart series={trendSeries(officer, store)} />
        </div>
      </div>
      <div>
        <h3 className="font-serif text-xl text-pine">Daily notes</h3>
        {journals.length === 0 && <p className="mt-1 text-sm text-stone-600">No daily note yet.</p>}
        <ul className="mt-2 space-y-2">
          {journals.slice(0, 4).map((entry) => (
            <li key={entry.at} className="rounded-lg bg-paper px-3 py-2 text-sm">
              <span className="text-xs text-stone-500">{formatDate(entry.at)}</span>
              <p>{entry.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-stone-600">
          Lunch record: {officer.lunches?.length ? `${officer.lunches.length} breaks, ${skipped} skipped` : officer.lunch_breaks || "Not recorded"}.
        </p>
      </div>
      <div>
        <h3 className="font-serif text-xl text-pine">What to do next</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          {(view?.actions || assessment.actions).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <article className="rounded-xl bg-paper p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Welfare officer</p>
        <p className="mt-1 font-semibold text-pine">{lead.welfare?.name}</p>
        <p className="text-stone-600">{lead.welfare?.qualification} · {lead.unit?.name}</p>
      </article>
      {role === "COMMANDER" && (
        <div>
          {done || relief?.granted ? (
            <p className="text-sm text-pine-soft">Lighter duty is in place{relief?.date ? ` from ${formatDate(relief.date)}` : ""}.</p>
          ) : (
            <PrimaryButton
              onClick={() => {
                onRelief()
                setDone(true)
              }}
            >
              Grant lighter duty
            </PrimaryButton>
          )}
        </div>
      )}
    </article>
  )
}
