import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { DUTY_TYPES, FORCES, STATES, UNITS } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { homePath } from "../lib/auth.js"
import { Field, PrimaryButton, controlClass } from "../components/Ui.jsx"

const ROLES = [
  ["OFFICER", "On-duty officer"],
  ["WELFARE", "Welfare officer"],
  ["COMMANDER", "Commander"],
  ["ADMIN", "Administrator"],
]

export function Register() {
  const { user, register } = useApp()
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    role: "OFFICER",
    full_name: "",
    force_name: FORCES[0],
    rank_name: "",
    posting_state: STATES[0],
    station_city: "",
    duty_type: DUTY_TYPES[0],
    weekly_duty_hours: "48",
    night_shifts_last_30_days: "0",
    overtime_hours_last_30_days: "0",
    open_assignments: "0",
    stress_score: "3",
    sleep_hours: "6.5",
    mood_score: "3",
    energy_score: "3",
    felt_supported: "No",
    qualification: "",
    unitId: UNITS[0].id,
    title: "",
  })

  if (user) return <Navigate to={homePath(user.role)} replace />

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function next(event) {
    event.preventDefault()
    if (form.password.length < 6) {
      setError("Use at least 6 characters for the password.")
      return
    }
    if (form.password !== form.confirm) {
      setError("The passwords do not match.")
      return
    }
    setError("")
    setStep(2)
  }

  async function finish(event) {
    event.preventDefault()
    setPending(true)
    setError("")
    try {
      await register(form)
    } catch (registerError) {
      setError(registerError.message)
      setPending(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <Link to="/login" className="text-sm font-semibold text-pine">Back to sign in</Link>
      <h1 className="mt-4 font-serif text-4xl text-pine">Create an account</h1>
      <p className="mt-2 text-sm text-stone-600">Step {step} of 2. The second step follows the role you choose.</p>

      {step === 1 ? (
        <form onSubmit={next} className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-5">
          <Field label="User ID">
            <input className={controlClass} value={form.username} onChange={(event) => set("username", event.target.value)} required minLength={3} />
          </Field>
          <Field label="Password">
            <input className={controlClass} type="password" value={form.password} onChange={(event) => set("password", event.target.value)} required />
          </Field>
          <Field label="Confirm password">
            <input className={controlClass} type="password" value={form.confirm} onChange={(event) => set("confirm", event.target.value)} required />
          </Field>
          <Field label="Role">
            <select className={controlClass} value={form.role} onChange={(event) => set("role", event.target.value)}>
              {ROLES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          {error && <p className="text-sm text-[#9a4d12]">{error}</p>}
          <PrimaryButton type="submit">Continue</PrimaryButton>
        </form>
      ) : (
        <form onSubmit={finish} className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-5">
          <Field label="Full name">
            <input className={controlClass} value={form.full_name} onChange={(event) => set("full_name", event.target.value)} required />
          </Field>
          {form.role === "OFFICER" && <OfficerFields form={form} set={set} />}
          {form.role === "WELFARE" && (
            <>
              <Field label="Qualification">
                <input className={controlClass} value={form.qualification} onChange={(event) => set("qualification", event.target.value)} required />
              </Field>
              <UnitField form={form} set={set} />
            </>
          )}
          {form.role === "COMMANDER" && (
            <>
              <Field label="Rank">
                <input className={controlClass} value={form.rank_name} onChange={(event) => set("rank_name", event.target.value)} required />
              </Field>
              <UnitField form={form} set={set} />
            </>
          )}
          {form.role === "ADMIN" && (
            <Field label="Staff title">
              <input className={controlClass} value={form.title} onChange={(event) => set("title", event.target.value)} required />
            </Field>
          )}
          {error && <p className="text-sm text-[#9a4d12]">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-pine">Back</button>
            <PrimaryButton type="submit" disabled={pending}>{pending ? "Saving…" : "Create account"}</PrimaryButton>
          </div>
        </form>
      )}
    </div>
  )
}

function UnitField({ form, set }) {
  return (
    <Field label="Unit">
      <select className={controlClass} value={form.unitId} onChange={(event) => set("unitId", event.target.value)}>
        {UNITS.map((unit) => (
          <option key={unit.id} value={unit.id}>{unit.name}</option>
        ))}
      </select>
    </Field>
  )
}

function OfficerFields({ form, set }) {
  return (
    <>
      <Field label="Force">
        <select className={controlClass} value={form.force_name} onChange={(event) => set("force_name", event.target.value)}>
          {FORCES.map((force) => <option key={force}>{force}</option>)}
        </select>
      </Field>
      <Field label="Rank">
        <input className={controlClass} value={form.rank_name} onChange={(event) => set("rank_name", event.target.value)} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Posting state">
          <select className={controlClass} value={form.posting_state} onChange={(event) => set("posting_state", event.target.value)}>
            {STATES.map((state) => <option key={state}>{state}</option>)}
          </select>
        </Field>
        <Field label="Station city">
          <input className={controlClass} value={form.station_city} onChange={(event) => set("station_city", event.target.value)} required />
        </Field>
      </div>
      <Field label="Duty type">
        <input className={controlClass} list="duty-types" value={form.duty_type} onChange={(event) => set("duty_type", event.target.value)} required />
        <datalist id="duty-types">
          {DUTY_TYPES.map((duty) => <option key={duty} value={duty} />)}
        </datalist>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Weekly duty hours" name="weekly_duty_hours" form={form} set={set} />
        <NumberField label="Night shifts, last 30 days" name="night_shifts_last_30_days" form={form} set={set} />
        <NumberField label="Overtime hours, last 30 days" name="overtime_hours_last_30_days" form={form} set={set} />
        <NumberField label="Open assignments" name="open_assignments" form={form} set={set} />
        <NumberField label="Stress (1–5)" name="stress_score" form={form} set={set} min="1" max="5" />
        <NumberField label="Sleep hours" name="sleep_hours" form={form} set={set} step="0.5" />
        <NumberField label="Mood (1–5)" name="mood_score" form={form} set={set} min="1" max="5" />
        <NumberField label="Energy (1–5)" name="energy_score" form={form} set={set} min="1" max="5" />
      </div>
      <Field label="Felt supported">
        <select className={controlClass} value={form.felt_supported} onChange={(event) => set("felt_supported", event.target.value)}>
          <option>No</option>
          <option>Yes</option>
        </select>
      </Field>
    </>
  )
}

function NumberField({ label, name, form, set, min = "0", max, step = "1" }) {
  return (
    <Field label={label}>
      <input className={controlClass} type="number" min={min} max={max} step={step} value={form[name]} onChange={(event) => set(name, event.target.value)} required />
    </Field>
  )
}
