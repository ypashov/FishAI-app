import { NavLink, Outlet } from 'react-router-dom'

const navClass =
  'rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        <header className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <NavLink to="/" className="flex items-center gap-3 text-slate-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold">
              FA
            </span>
            <div>
              <div className="text-lg font-semibold leading-tight">Fish AI</div>
              <div className="text-xs text-slate-400">Azure-assisted recognition</div>
            </div>
          </NavLink>
          <nav className="flex flex-wrap gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navClass} ${
                  isActive ? 'bg-slate-900 text-blue-300 shadow-sm' : 'text-slate-300 bg-slate-900/60'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `${navClass} ${
                  isActive ? 'bg-blue-500 text-slate-900 shadow-sm' : 'text-slate-300 bg-slate-900/60'
                }`
              }
            >
              Upload
            </NavLink>
            <NavLink
              to="/results"
              className={({ isActive }) =>
                `${navClass} ${
                  isActive ? 'bg-slate-900 text-blue-300 shadow-sm' : 'text-slate-300 bg-slate-900/60'
                }`
              }
            >
              Results
            </NavLink>
          </nav>
        </header>

        <main className="flex-1 pb-10">
          <Outlet />
        </main>

        <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Fish AI
        </footer>
      </div>
    </div>
  )
}
