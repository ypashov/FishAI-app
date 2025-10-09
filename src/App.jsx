import { NavLink, Outlet } from 'react-router-dom'

const navClass =
  'rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-blue-600'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        <header className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <NavLink to="/" className="flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              FA
            </span>
            <div>
              <div className="text-lg font-semibold leading-tight">Fish AI</div>
              <div className="text-xs text-slate-500">Azure-assisted fish recognition</div>
            </div>
          </NavLink>
          <nav className="flex flex-wrap gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navClass} ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `${navClass} ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`
              }
            >
              Upload
            </NavLink>
            <NavLink
              to="/results"
              className={({ isActive }) =>
                `${navClass} ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`
              }
            >
              Results
            </NavLink>
          </nav>
        </header>

        <main className="flex-1 pb-10">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Fish AI
        </footer>
      </div>
    </div>
  )
}
