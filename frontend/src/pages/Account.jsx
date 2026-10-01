import { leadership, unitForOfficer } from "../data/units.js"
import { useApp } from "../context/app-context.js"
import { formatDate } from "../lib/format.js"
import { GhostButton, PrimaryButton } from "../components/Ui.jsx"

export function Account() {
  const { user, logout, officers, store, datasetReady, revokeDataset, allowDataset } = useApp()
  const officer = officers.find((person) => person.service_no === user?.serviceNo)
  const unit = user?.unitId ? leadership(user.unitId, store.users) : officer ? leadership(unitForOfficer(officer)?.id, store.users) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Account</p>
      <h1 className="mt-1 font-serif text-3xl text-pine">{user?.name}</h1>
      <dl className="mt-5 grid gap-3 rounded-xl border border-line bg-white p-4 text-sm sm:grid-cols-2">
        <Item label="User ID" value={user?.username} />
        <Item label="Role" value={roleLabel(user?.role)} />
        {user?.serviceNo && <Item label="Service number" value={user.serviceNo} />}
        {user?.rank && <Item label="Rank" value={user.rank} />}
        {(user?.force || officer?.force_name) && <Item label="Force" value={user.force || officer.force_name} />}
        {user?.qualification && <Item label="Qualification" value={user.qualification} />}
        {user?.title && <Item label="Title" value={user.title} />}
        {unit?.unit && <Item label="Unit" value={unit.unit.name} />}
        {officer && <Item label="Posting" value={`${officer.deployment_record}`} />}
        {officer && <Item label="Duty" value={officer.duty_type} />}
      </dl>

      {user?.role === "ADMIN" && (
        <section id="permissions" className="mt-6 rounded-xl border border-line bg-white p-4">
          <h2 className="font-serif text-2xl text-pine">Account permissions</h2>
          <p className="mt-2 text-sm text-stone-600">
            Dataset access is {datasetReady ? `allowed since ${formatDate(store.importedAt)}` : "not allowed"}.
            Revoking access hides officer, commander, and welfare screens until you allow it again. Records already copied stay in the app database.
          </p>
          <div className="mt-4">
            {datasetReady ? (
              <GhostButton onClick={revokeDataset}>Revoke dataset access</GhostButton>
            ) : (
              <PrimaryButton onClick={allowDataset}>Allow dataset access</PrimaryButton>
            )}
          </div>
        </section>
      )}

      <GhostButton className="mt-6" onClick={logout}>Log out</GhostButton>
    </div>
  )
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{label}</dt>
      <dd className="mt-1 text-stone-800">{value || "—"}</dd>
    </div>
  )
}

function roleLabel(role) {
  if (role === "ADMIN") return "Administrator"
  if (role === "COMMANDER") return "Commander"
  if (role === "WELFARE") return "Welfare officer"
  return "On-duty officer"
}
