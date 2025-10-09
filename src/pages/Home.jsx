import { Link } from 'react-router-dom'

const quickFacts = [
  { title: 'Secure upload', description: 'Images land in your private Azure Blob container.' },
  { title: 'AI summary', description: 'Azure Vision highlights likely species and objects.' },
  { title: 'Shareable link', description: 'Get a one-hour SAS link for teammates or clients.' }
]

export default function Home() {
  return (
    <div className="space-y-8 rounded-2xl bg-slate-900/70 p-8 shadow-lg shadow-slate-950/40">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-wide text-blue-400/80">Fish AI</p>
        <h1 className="text-3xl font-semibold text-slate-50">Upload a fish photo. Get instant insights.</h1>
        <p className="text-sm text-slate-400">
          Secure upload, Azure Vision analysis, and shareable insights in seconds.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-blue-400"
          >
            Start with an upload
          </Link>
          <Link
            to="/results"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
          >
            See last result
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickFacts.map((fact) => (
          <div
            key={fact.title}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fact.title}
            </span>
            <p className="mt-2 text-slate-400">{fact.description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
