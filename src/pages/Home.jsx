import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const baseFacts = [
  { title: 'Secure upload', description: 'Images stay in your Azure Blob container.' },
  { title: 'AI summary', description: 'Azure Vision highlights likely species and objects.' },
  { title: 'Shareable link', description: 'Each upload returns a one-hour SAS link.' }
]

export default function Home() {
  const [totalRecognitions, setTotalRecognitions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        const response = await fetch('/api/stats')
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || `Stats request failed (${response.status})`)
        }
        if (isMounted) {
          setTotalRecognitions(payload.totalRecognitions ?? 0)
        }
      } catch (err) {
        console.error('Failed to load stats', err)
        if (isMounted) {
          setError('Stats unavailable')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStats()
    return () => {
      isMounted = false
    }
  }, [])

  const displayCount =
    totalRecognitions !== null ? totalRecognitions.toLocaleString() : loading ? '…' : '—'

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
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Total recognitions
          </span>
          <div className="mt-3 text-3xl font-semibold text-slate-50">{displayCount}</div>
          <p className="mt-2 text-xs text-slate-500">
            {error ? error : 'Count pulled from Azure storage uploads.'}
          </p>
        </div>
        {baseFacts.map((fact) => (
          <div
            key={fact.title}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300"
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
