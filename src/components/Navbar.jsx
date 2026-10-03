import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useApp } from "../context/app-context.js"
import { initials } from "../lib/format.js"
import { noticesFor } from "../lib/notices.js"

export function Navbar() {
  const { user, logout, officers, store, markNoticesRead } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const rootRef = useRef(null)
  const notices = user?.role === "WELFARE" ? noticesFor(user.unitId, officers, store) : []
  const unread = notices.filter((item) => !store.readIds?.includes(item.id))

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setMenuOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const tracker =
    user?.role === "COMMANDER"
      ? "/commander/tracker"
      : user?.role === "WELFARE"
        ? "/welfare/tracker"
        : ""

  function openBell() {
    setBellOpen((open) => !open)
    setMenuOpen(false)
    if (unread.length) markNoticesRead(unread.map((item) => item.id))
  }

  return (
    <header ref={rootRef} className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="h-0.5 bg-gradient-to-r from-pine via-gold-soft to-saffron" />
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
        <Link to={user?.role === "ADMIN" ? "/admin" : tracker ? tracker.replace("/tracker", "") : "/officer"} className="flex min-w-0 items-center gap-2">
          <img src="/logo.jpg" alt="" className="h-11 w-11 rounded-full bg-white object-contain" />
          <span className="truncate font-serif text-xl tracking-tight sm:text-2xl">
            <span className="text-pine">Veer</span>
            <span className="text-gold">Sankalp</span>
          </span>
        </Link>

        {tracker && (
          <Link
            to={tracker}
            className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-pine hover:bg-paper"
          >
            Tracker
          </Link>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user?.role === "WELFARE" && (
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={openBell}
                className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-paper"
              >
                <BellIcon />
                {unread.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-pulse rounded-full bg-saffron" />
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Notifications</p>
                  {notices.length === 0 && <p className="px-2 py-3 text-sm text-stone-500">No new notices.</p>}
                  <ul className="max-h-80 overflow-y-auto">
                    {notices.map((item) => (
                      <li key={item.id} className="rounded-lg px-2 py-2 hover:bg-paper">
                        <p className="text-sm font-semibold text-pine">{item.title}</p>
                        <p className="text-sm text-stone-600">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              aria-label="Account menu"
              onClick={() => {
                setMenuOpen((open) => !open)
                setBellOpen(false)
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-pine text-sm font-semibold text-white"
            >
              {initials(user?.name || "User")}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-white p-1 shadow-lg">
                <Link to="/account" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-paper">
                  Account
                </Link>
                {user?.role === "ADMIN" && (
                  <Link
                    to="/account#permissions"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-paper"
                  >
                    Account permissions
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-paper"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e3b2e" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}
