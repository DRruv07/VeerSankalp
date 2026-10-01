import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useApp } from "../context/app-context.js"
import { homePath } from "../lib/auth.js"
import { PrimaryButton, controlClass } from "../components/Ui.jsx"

const DEMOS = [
  ["Administrator", "admin", "admin123"],
  ["On-duty officer", "UF-1005", "officer123"],
  ["Commander", "commander", "commander123"],
  ["Welfare officer", "welfare", "welfare123"],
]

export function Login() {
  const { user, ready, login } = useApp()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  if (user) return <Navigate to={homePath(user.role)} replace />

  function onSubmit(event) {
    event.preventDefault()
    const result = login(username, password)
    if (!result.ok) setMessage(result.message)
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <img src="/logo.jpg" alt="VeerSankalp" className="mx-auto h-28 w-28 object-contain" />
        <h1 className="mt-2 text-center font-serif text-4xl tracking-tight">
          <span className="text-pine">Veer</span>
          <span className="text-gold">Sankalp</span>
        </h1>
        <p className="mt-2 text-center text-sm text-stone-600">
          Mental health and workload tracking for Indian uniformed officers.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">User ID</span>
            <input className={controlClass} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Password</span>
            <input className={controlClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {message && <p className="text-sm text-[#9a4d12]">{message}</p>}
          <PrimaryButton type="submit" className="w-full" disabled={!ready}>
            {ready ? "Sign in" : "Loading records…"}
          </PrimaryButton>
        </form>

        <p className="mt-4 text-center text-sm">
          New here? <Link to="/register" className="font-semibold text-pine">Create an account</Link>
        </p>

        <div className="mt-6 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Demonstration access</p>
          <ul className="mt-2 space-y-1">
            {DEMOS.map(([label, id, pass]) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(id)
                    setPassword(pass)
                    setMessage("")
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-paper"
                >
                  <span>{label}</span>
                  <span className="text-stone-500">{id}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
