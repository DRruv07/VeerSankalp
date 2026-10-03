import { useState } from "react"
import { useApp } from "../context/app-context.js"
import { formatDate } from "../lib/format.js"
import { currentAssessment, isAttended, riskCounts } from "../lib/risk.js"
import { AiNote, Modal, PrimaryButton, RiskBadge } from "../components/Ui.jsx"

export function Admin() {
  const { officers, store, allowDataset, user } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const arrivals = officers.filter((officer) => officer.isNew)
  const counts = riskCounts(officers, store)

  async function allow() {
    setBusy(true)
    setError("")
    try {
      await allowDataset()
    } catch (allowError) {
      setError(allowError.message || "The dataset could not be copied.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {!store.allowed && (
        <Modal title="Allow the officer dataset?" locked>
          <p className="text-sm leading-6 text-stone-700">
            VeerSankalp needs permission to use the officer files. Allowing access copies {officers.length} records
            into the app database. Checkups, notes, and duty relief stay in that copy. The original files change only
            when a new officer is added.
          </p>
          <p className="mt-3 text-sm text-stone-600">
            Signed in as {user?.name}. Gemini writes a short risk brief. It does not rewrite the rows.
          </p>
          {error && <p className="mt-3 text-sm text-[#9a4d12]">{error}</p>}
          <PrimaryButton className="mt-5" onClick={allow} disabled={busy || officers.length === 0}>
            {busy ? "Copying records…" : "Allow access"}
          </PrimaryButton>
        </Modal>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Administrator</p>
      <h1 className="mt-1 font-serif text-3xl text-pine">Dataset access</h1>
      {store.allowed ? (
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Working copy released {formatDate(store.importedAt)}. {counts.total} officers · {counts.High} high · {counts.Moderate} moderate · {counts.Low} low.
        </p>
      ) : (
        <p className="mt-2 text-sm text-stone-600">The working copy is locked until you allow access.</p>
      )}

      {store.allowed && store.brief && (
        <div className="mt-4 max-w-3xl">
          <AiNote view={store.brief} />
        </div>
      )}

      <section className="mt-6">
        <h2 className="font-serif text-2xl text-pine">New officers</h2>
        <p className="mt-1 text-sm text-stone-600">People added after the original 36 records. Their current mental-health reading is shown here.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Service no.</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Force</th>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Mental status</th>
                <th className="px-4 py-3 font-semibold">Arrived</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-stone-500">No new officer has been added yet.</td>
                </tr>
              )}
              {arrivals.map((officer) => {
                const assessment = currentAssessment(officer, store)
                return (
                  <tr key={officer.service_no} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold text-pine">{officer.service_no}</td>
                    <td className="px-4 py-3">{officer.full_name}</td>
                    <td className="px-4 py-3">{officer.force_name}</td>
                    <td className="px-4 py-3">{officer.rank_name}</td>
                    <td className="px-4 py-3">
                      <span className="mr-2">{assessment.score}</span>
                      <RiskBadge band={assessment.band} />
                      <span className="ml-2 text-stone-500">{isAttended(officer, store) ? "In care" : "Unattended"}</span>
                    </td>
                    <td className="px-4 py-3">{formatDate(officer.arrived_on)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
