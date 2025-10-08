import { Outlet, NavLink } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Fish AI</h1>
          <nav className="flex gap-4">
            <NavLink to="/" className={({isActive}) => isActive ? 'text-blue-600' : 'text-slate-700'}>Home</NavLink>
            <NavLink to="/upload" className={({isActive}) => isActive ? 'text-blue-600' : 'text-slate-700'}>Upload</NavLink>
            <NavLink to="/results" className={({isActive}) => isActive ? 'text-blue-600' : 'text-slate-700'}>Results</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-slate-500">
          © {new Date().getFullYear()} Fish AI
        </div>
      </footer>
    </div>
  )
}
