import { Link } from 'react-router-dom'

const quickFacts = [
  { title: 'Secure upload', description: 'Images land in your private Azure Blob container.' },
  { title: 'AI summary', description: 'Azure Vision highlights likely species and objects.' },
  { title: 'Shareable link', description: 'Get a one-hour SAS link for teammates or clients.' }
]

export default function Home() {
  return (
    <div className="space-y-8 rounded-2xl bg-white/80 p-8 shadow-sm">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-blue-600">Fish AI</p>
        <h1 className="text-3xl font-semibold text-slate-900">Upload a fish photo. Get instant insights.</h1>
        <p className="text-sm text-slate-600">
          Fish AI stores your photo securely, runs Azure Vision analysis, and surfaces the essentials in seconds.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start with an upload
          </Link>
          <Link
            to="/results"
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            See last result
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickFacts.map((fact) => (
          <div key={fact.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">{fact.title}</span>
            <p className="mt-2 text-sm text-slate-600">{fact.description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
