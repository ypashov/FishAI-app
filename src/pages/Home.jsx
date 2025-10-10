import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const RECENT_LIMIT = 6

// Landing page: highlights headline metrics plus a snapshot of recent analyses.
export default function Home() {
  const [totalRecognitions, setTotalRecognitions] = useState(null)
  const [recent, setRecent] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [recentError, setRecentError] = useState('')

  useEffect(() => {
    let isMounted = true

    // Fetch aggregate counters once on mount.
    async function loadStats() {
      try {
        const response = await fetch('/api/stats')
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || `Stats request failed (${response.status})`)
        if (isMounted) setTotalRecognitions(payload.totalRecognitions ?? 0)
      } catch (err) {
        console.error('Failed to load stats', err)
      }
    }

    // Fetch the public feed of recent analyses.
    async function loadRecent() {
      setLoadingRecent(true)
      setRecentError('')
      try {
        const response = await fetch(`/api/recent?limit=${RECENT_LIMIT}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || `Recent request failed (${response.status})`)
        if (isMounted) setRecent(payload.items || [])
      } catch (err) {
        console.error('Failed to load recent analyses', err)
        if (isMounted) setRecentError('Unable to load recent analyses right now.')
      } finally {
        if (isMounted) setLoadingRecent(false)
      }
    }

    loadStats()
    loadRecent()
    return () => {
      isMounted = false
    }
  }, [])

  const displayCount = totalRecognitions !== null ? totalRecognitions.toLocaleString() : 'N/A'

  return (
    <div className="space-y-10">
      <section className="space-y-6 rounded-2xl bg-slate-900/70 p-8 shadow-lg shadow-slate-950/40">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-blue-400/80">Fish Classifier (Demo)</p>
          <h1 className="text-3xl font-semibold text-slate-50">Know your catch with a single photo.</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Upload a fish image and our recognition engine highlights the most probable species along with the visual cues it used to make the call.
          </p>
        </div>
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
            View detailed results
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Fish analyzed
          </span>
          <div className="mt-3 text-3xl font-semibold text-slate-50">{displayCount}</div>
          <p className="mt-2 text-xs text-slate-500">
            Total recognitions completed across the Fish Classifier (Demo) community.
          </p>
        </div>
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent analyses</h2>
            {loadingRecent ? (
              <span className="text-xs text-slate-500">Loading...</span>
            ) : (
              <span className="text-xs text-slate-500">
                Latest {Math.min(recent.length, RECENT_LIMIT)} uploads
              </span>
            )}
          </div>
          {recentError && <p className="mb-3 text-xs text-red-400">{recentError}</p>}
          {loadingRecent && !recent.length ? (
            <p className="text-sm text-slate-500">Fetching recent analyses...</p>
          ) : recent.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((item) => {
                const primaryObject = item.objects?.[0]
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                  >
                    {item.sasUrl ? (
                      <img
                        src={item.sasUrl}
                        alt={item.fileName || 'Analysis thumbnail'}
                        className="h-12 w-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-500">
                        --
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-200">
                        {item.fileName || 'Untitled upload'}
                      </div>
                      {primaryObject ? (
                        <div className="text-xs text-slate-500">
                          {primaryObject.name} - {formatConfidence(primaryObject.confidence)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">No objects detected</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No public analyses yet. Be the first to upload a fish photo.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function formatConfidence(value) {
  if (typeof value !== 'number') return 'N/A'
  return `${Math.round(value * 100)}%`
}
