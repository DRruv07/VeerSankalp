import { useState } from "react"
import { leadership } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { formatDate } from "../lib/format.js"
import { useRiskView } from "../lib/useRiskView.js"
import {
  careStatus,
  currentAssessment,
  dutyHours,
  trendSeries,
} from "../lib/risk.js"
import { FactorChart, TrendChart } from "../components/Charts.jsx"
import { AiNote, Field, Modal, PrimaryButton, RiskDial, controlClass } from "../components/Ui.jsx"

export function OfficerDashboard() {
  const { user, officers, store, saveJournal, setSupport, submitFeedback } = useApp()
  const officer = officers.find((person) => person.service_no === user?.serviceNo)
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState({ supportReceived: "", helpful: "3", continuePlan: "" })
  const assessment = officer ? currentAssessment(officer, store) : null
  const { view, loading } = useRiskView({ officer, role: "OFFICER", assessment })

  if (!officer || !assessment) {
    return <p className="px-4 py-8 text-sm text-stone-600">This account is not linked to an officer record.</p>
  }

  const unit = leadership(officer.unitId, store.users)
  const hours = dutyHours(officer, store)
  const support = store.support[officer.service_no]
  const existingFeedback = store.feedback.find((item) => item.serviceNo === officer.service_no)
  const journals = store.journals[officer.service_no] || []
  const relief = store.relief[officer.service_no]

  function chooseSupport(answer) {
    if (answer === "No") {
      setSupport(officer.service_no, "No")
      setFeedbackOpen(false)
      return
    }
    if (existingFeedback) {
      setSupport(officer.service_no, "Yes")
      return
    }
    setFeedbackOpen(true)
  }

  function sendFeedback(event) {
    event.preventDefault()
    submitFeedback({
      serviceNo: officer.service_no,
      unitId: officer.unitId,
      name: officer.full_name,
      supportReceived: feedback.supportReceived.trim(),
      helpful: feedback.helpful,
      continuePlan: feedback.continuePlan.trim(),
    })
    setFeedbackOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      {relief?.granted && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-stone-800">
          {unit.commander?.rank} {unit.commander?.name} has eased your duty so you can recover. Welfare follow-up still stands.
        </p>
      )}

      <section className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[auto_1fr] sm:p-5">
        <RiskDial score={assessment.score} band={assessment.band} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{officer.service_no}</p>
          <h1 className="font-serif text-3xl text-pine">{officer.full_name}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {officer.rank_name} · {officer.force_name} · {officer.duty_type} · {officer.deployment_record}
          </p>
          <p className="mt-2 text-sm text-stone-700">{careStatus(officer, store, assessment)} · baseline {assessment.baseline}</p>
          <div className="mt-4">
            <AiNote view={view} loading={loading} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Stress" value={`${officer.stress_score}/5`} />
        <Stat label="Sleep" value={`${officer.sleep_hours} h`} />
        <Stat label="Duty this week" value={`${hours.current} h`} hint={hours.eased ? `Eased from ${hours.raw} h` : "From the workload file"} />
        <Stat label="Fatigue" value={officer.fatigue_score} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="What is pushing the score">
          <FactorChart officer={officer} />
        </ChartCard>
        <ChartCard title="Six-week risk tracking">
          <TrendChart series={trendSeries(officer, store)} />
        </ChartCard>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 className="font-serif text-2xl text-pine">What to do next</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">
          {(view?.actions || assessment.actions).map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-4 text-sm text-stone-600">
          Commander: {unit.commander?.rank} {unit.commander?.name}. Welfare officer: {unit.welfare?.name}
          {unit.welfare?.qualification ? ` · ${unit.welfare.qualification}` : ""}.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 className="font-serif text-2xl text-pine">Today’s note</h2>
        <p className="mt-1 text-sm text-stone-600">Add anything the record does not show: how you feel today, or how the work is going.</p>
        <textarea
          className={`${controlClass} mt-3 min-h-28`}
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            setSaved(false)
          }}
          placeholder="What are you feeling today, and how is the work going?"
        />
        <PrimaryButton
          className="mt-3"
          disabled={!note.trim()}
          onClick={() => {
            saveJournal(officer.service_no, note)
            setNote("")
            setSaved(true)
          }}
        >
          Save note
        </PrimaryButton>
        {saved && <p className="mt-2 text-sm text-pine-soft">Saved to your tracking record.</p>}
        <ul className="mt-4 space-y-2">
          {journals.map((entry) => (
            <li key={entry.at} className="rounded-lg bg-paper px-3 py-2 text-sm">
              <span className="text-xs text-stone-500">{formatDate(entry.at)}</span>
              <p className="mt-1 text-stone-800">{entry.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 className="font-serif text-2xl text-pine">Did you get support?</h2>
        <p className="mt-1 text-sm text-stone-600">If you choose Yes, the feedback form is required before this answer is kept.</p>
        <div className="mt-4 flex gap-2">
          <Choice label="Yes" active={support === "Yes" || feedbackOpen} onClick={() => chooseSupport("Yes")} />
          <Choice label="No" active={support === "No"} onClick={() => chooseSupport("No")} />
        </div>
        {support === "No" && (
          <p className="mt-3 text-sm text-stone-700">Your commander and welfare officer can see that support is still missing.</p>
        )}
        {existingFeedback && (
          <p className="mt-3 text-sm text-stone-700">Feedback sent {formatDate(existingFeedback.at)}: {existingFeedback.supportReceived}</p>
        )}
      </section>

      {feedbackOpen && (
        <Modal title="Support feedback" locked>
          <form onSubmit={sendFeedback} className="space-y-4">
            <Field label="What support did you receive?">
              <textarea className={`${controlClass} min-h-24`} value={feedback.supportReceived} onChange={(event) => setFeedback({ ...feedback, supportReceived: event.target.value })} required />
            </Field>
            <Field label="How helpful was it?">
              <select className={controlClass} value={feedback.helpful} onChange={(event) => setFeedback({ ...feedback, helpful: event.target.value })}>
                <option value="1">1 — not helpful</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 — very helpful</option>
              </select>
            </Field>
            <Field label="What should continue?">
              <textarea className={`${controlClass} min-h-20`} value={feedback.continuePlan} onChange={(event) => setFeedback({ ...feedback, continuePlan: event.target.value })} required />
            </Field>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-pine"
                onClick={() => setFeedbackOpen(false)}
              >
                Back
              </button>
              <PrimaryButton type="submit">Submit feedback</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, hint }) {
  return (
    <article className="rounded-xl border border-line bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-pine">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </article>
  )
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <h2 className="font-serif text-xl text-pine">{title}</h2>
      <div className="mt-3 h-56">{children}</div>
    </article>
  )
}

function Choice({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`support-choice rounded-md px-5 py-2 text-sm font-semibold ${active ? "bg-pine text-white" : "border border-line bg-white text-pine"}`}
    >
      {label}
    </button>
  )
}
