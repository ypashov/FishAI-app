import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const highlights = [
  { title: 'Species match', description: 'Identify likely species in seconds with confidence scoring.' },
  { title: 'Smart details', description: 'Spot fins, patterns, and gear that influence the prediction.' },
  { title: 'Share-ready', description: 'Keep a record of every catch with gallery-friendly thumbnails.' }
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
          setError('Live counter unavailable')
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
    totalRecognitions !== null ? totalRecognitions.toLocaleString() : loading ? '...' : 'N/A'

  return (
    <div className="space-y-8 rounded-2xl bg-slate-900/70 p-8 shadow-lg shadow-slate-950/40">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-wide text-blue-400/80">Fish AI</p>
        <h1 className="text-3xl font-semibold text-slate-50">Know your catch with a single photo.</h1>
        <p className="text-sm text-slate-400">
          Upload a fish image and our recognition engine will highlight the most probable species along with the key visual cues it used.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-blue-400"
          >
            Upload a photo
          </Link>
          <Link
            to="/results"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
          >
            Browse recent identifications
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Fish analyzed
          </span>
          <div className="mt-3 text-3xl font-semibold text-slate-50">{displayCount}</div>
          <p className="mt-2 text-xs text-slate-500">
            {error ? error : 'Cumulative recognitions completed by Fish AI.'}
          </p>
        </div>
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {item.title}
            </span>
            <p className="mt-2 text-slate-400">{item.description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
