import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'fishai:lastPrediction'
const HISTORY_KEY = 'fishai:history'

function readStoredPrediction() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('Unable to parse cached prediction', err)
    return null
  }
}

function formatConfidence(value) {
  if (typeof value !== 'number') return '—'
  return `${Math.round(value * 100)}%`
}

function readHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Unable to parse history', err)
    return []
  }
}

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  const initial = useMemo(() => location.state?.prediction || readStoredPrediction(), [location.state])
  const initialHistory = useMemo(() => readHistory(), [])

  const [prediction, setPrediction] = useState(initial)
  const [imageSource, setImageSource] = useState(initial?.sasUrl || initial?.previewDataUrl || '')
  const [history, setHistory] = useState(initialHistory)

  useEffect(() => {
    if (!location.state?.prediction) return
    const next = location.state.prediction
    setPrediction(next)
    setImageSource(next.sasUrl || next.previewDataUrl || '')
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
    setHistory(readHistory())
  }, [location.state])

  useEffect(() => {
    if (!prediction) return
    setImageSource(prediction.sasUrl || prediction.previewDataUrl || '')
  }, [prediction])

  const handleImageError = () => {
    if (prediction?.previewDataUrl) {
      setImageSource(prediction.previewDataUrl)
    }
  }

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-slate-900/70 p-6 text-center shadow-lg shadow-slate-950/40">
        <h2 className="text-xl font-semibold text-slate-50">No analysis yet</h2>
        <p className="mt-2 text-sm text-slate-400">Upload a fish photo to see Azure Vision results.</p>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="mt-4 rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-blue-400"
        >
          Go to upload
        </button>
      </div>
    )
  }

  const { objects = [], analyzedAt, fileName, sasUrl, id: currentId } = prediction
  const recentHistory = history.filter((item) => item.id !== currentId).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Latest analysis</h2>
          <p className="text-sm text-slate-400">Powered by Azure AI Vision</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
        >
          Analyze another photo
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
          {imageSource ? (
            <img
              src={imageSource}
              alt={fileName || 'Uploaded fish'}
              onError={handleImageError}
              className="w-full max-h-[420px] rounded-lg border border-slate-800 bg-slate-950/80 object-contain p-2"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
              No preview available
            </div>
          )}
          <div className="text-xs text-slate-400">
            {fileName && <div className="font-medium text-slate-300">{fileName}</div>}
            {analyzedAt && <div>Analyzed {new Date(analyzedAt).toLocaleString()}</div>}
            {sasUrl && (
              <div className="truncate">
                <span className="font-medium text-slate-300">SAS link:</span>{' '}
                <a href={sasUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  open
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Detected objects</span>
            {objects.length ? (
              <div className="space-y-1 text-sm text-slate-300">
                {objects.slice(0, 8).map((obj, index) => (
                  <div key={`${obj.name}-${index}`}>
                    {obj.name} · {formatConfidence(obj.confidence)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No objects detected.</p>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent analyses</h3>
          <span className="text-xs text-slate-500">Latest 5 uploads</span>
        </div>
        {recentHistory.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentHistory.map((item) => {
              const thumb = item.sasUrl || item.previewDataUrl
              const primaryObject = item.objects?.[0]
              return (
                <div
                  key={item.id || item.blobName || item.fileName}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={item.fileName || 'Analysis thumbnail'}
                      className="h-12 w-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-500">
                      —
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-200">
                      {item.fileName || 'Unnamed upload'}
                    </div>
                    {primaryObject ? (
                      <div className="text-xs text-slate-500">
                        {primaryObject.name} · {formatConfidence(primaryObject.confidence)}
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
          <p className="text-sm text-slate-500">Upload a few photos to build your history.</p>
        )}
      </section>
    </div>
  )
}
