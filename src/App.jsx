import { NavLink, Outlet } from 'react-router-dom'

const linkBase =
  'px-3 py-2 text-sm font-medium rounded-full transition-colors duration-150 hover:text-blue-600'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-slate-50 via-white to-sky-50">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                FA
              </span>
              <div>
                <NavLink to="/" className="text-lg font-semibold text-slate-900">
                  Fish AI
                </NavLink>
                <div className="text-xs text-slate-500">Azure-powered fish recognition</div>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600'}`
                }
              >
                Upload
              </NavLink>
              <NavLink
                to="/results"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`
                }
              >
                Results
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500">
            (c) {new Date().getFullYear()} Fish AI. Built with Azure Static Web Apps.
          </div>
        </footer>
      </div>
    </div>
  )
}
