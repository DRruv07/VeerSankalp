export function RiskBadge({ band }) {
  const tone = {
    High: "bg-saffron/15 text-[#9a4d12]",
    Moderate: "bg-gold/15 text-[#7a5e22]",
    Low: "bg-pine-soft/15 text-pine-soft",
  }[band] || "bg-stone-100 text-stone-600"
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{band}</span>
}

export function RiskDial({ score = 0, band = "Low" }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference
  const color = band === "High" ? "#e07a2f" : band === "Moderate" ? "#a6843d" : "#1f6b4a"

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e6dfd2" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-pine">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{band}</span>
      </div>
    </div>
  )
}

export function Modal({ title, children, onClose, locked = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-pine/45"
        aria-label="Close dialog"
        onClick={locked ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 className="font-serif text-2xl text-pine">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function AiNote({ view, loading }) {
  if (loading) {
    return <p className="text-sm text-stone-500">Gemini is reading this record…</p>
  }
  if (!view) return null
  return (
    <div className="rounded-lg bg-paper px-3 py-3 text-sm leading-6 text-stone-700">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
        {view.ok ? "Gemini view" : "Record view"}
      </p>
      <p className="mt-1 font-semibold text-pine">{view.headline}</p>
      <p className="mt-1">{view.summary}</p>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  )
}

export const controlClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-stone-900 outline-none"

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-soft disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-pine hover:bg-paper disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
