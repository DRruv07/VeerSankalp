import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import { Navbar } from "./components/Navbar.jsx"
import { useApp } from "./context/app-context.js"
import { AppProvider } from "./context/AppContext.jsx"
import { homePath } from "./lib/auth.js"
import { Account } from "./pages/Account.jsx"
import { Admin } from "./pages/Admin.jsx"
import { CommanderDashboard } from "./pages/CommanderDashboard.jsx"
import { Login } from "./pages/Login.jsx"
import { OfficerDashboard } from "./pages/OfficerDashboard.jsx"
import { Register } from "./pages/Register.jsx"
import { CommanderTracker, WelfareTracker } from "./pages/Tracker.jsx"
import { WelfareDashboard } from "./pages/WelfareDashboard.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Shell />}>
            <Route path="/account" element={<Account />} />
            <Route element={<Role role="ADMIN" />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route element={<Role role="OFFICER" />}>
              <Route path="/officer" element={<OfficerDashboard />} />
            </Route>
            <Route element={<Role role="COMMANDER" />}>
              <Route path="/commander" element={<CommanderDashboard />} />
              <Route path="/commander/tracker" element={<CommanderTracker />} />
              <Route path="/commander/tracker/:serviceNo" element={<CommanderTracker />} />
            </Route>
            <Route element={<Role role="WELFARE" />}>
              <Route path="/welfare" element={<WelfareDashboard />} />
              <Route path="/welfare/tracker" element={<WelfareTracker />} />
              <Route path="/welfare/tracker/:serviceNo" element={<WelfareTracker />} />
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

function HomeRedirect() {
  const { user, ready } = useApp()
  if (!ready) return <Loading />
  return <Navigate to={user ? homePath(user.role) : "/login"} replace />
}

function Shell() {
  const { user, ready, error, datasetReady } = useApp()
  const location = useLocation()
  if (!ready) return <Loading />
  if (error) return <Loading message={error} />
  if (!user) return <Navigate to="/login" replace />
  const locked = user.role !== "ADMIN" && !datasetReady && location.pathname !== "/account"
  const showWelcome = ["/admin", "/officer", "/commander", "/welfare"].includes(location.pathname)
  return (
    <div className="min-h-screen">
      <Navbar />
      {showWelcome && <Welcome name={user.name} />}
      {locked ? <DatasetLocked /> : <Outlet />}
    </div>
  )
}

function Welcome({ name }) {
  return (
    <p className="px-4 pt-5 text-center font-serif text-2xl text-pine sm:text-3xl">
      Welcome, {name}
    </p>
  )
}

function Role({ role }) {
  const { user } = useApp()
  if (user?.role !== role) return <Navigate to={homePath(user.role)} replace />
  return <Outlet />
}

function DatasetLocked() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl text-pine">Dataset not released</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        An administrator has to allow the officer dataset before this dashboard can open. Sign in as admin and choose Allow access.
      </p>
    </div>
  )
}

function Loading({ message = "Loading officer records…" }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <p className="text-sm text-pine">{message}</p>
    </div>
  )
}
