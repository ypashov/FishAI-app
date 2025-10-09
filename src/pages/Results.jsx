import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'fishai:lastPrediction'

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

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  const initial = useMemo(() => location.state?.prediction || readStoredPrediction(), [location.state])

  const [prediction, setPrediction] = useState(initial)
  const [imageSource, setImageSource] = useState(initial?.sasUrl || initial?.previewDataUrl || '')

  useEffect(() => {
    if (!location.state?.prediction) return
    const next = location.state.prediction
    setPrediction(next)
    setImageSource(next.sasUrl || next.previewDataUrl || '')
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
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
      <div className="rounded-2xl bg-white/80 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">No analysis yet</h2>
        <p className="mt-2 text-sm text-slate-600">Upload a fish photo to see Azure Vision results.</p>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to upload
        </button>
      </div>
    )
  }

  const { description, tags = [], objects = [], analyzedAt, fileName, sasUrl } = prediction

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Latest analysis</h2>
          <p className="text-sm text-slate-500">Generated with Azure AI Vision</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Analyze another photo
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm">
          {imageSource ? (
            <img
              src={imageSource}
              alt={fileName || 'Uploaded fish'}
              onError={handleImageError}
              className="w-full max-h-[420px] rounded-lg object-contain bg-slate-100"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              No preview available
            </div>
          )}
          <div className="text-xs text-slate-500">
            {fileName && <div className="font-medium text-slate-600">{fileName}</div>}
            {analyzedAt && <div>Analyzed {new Date(analyzedAt).toLocaleString()}</div>}
            {sasUrl && (
              <div className="truncate">
                <span className="font-medium">SAS link:</span>{' '}
                <a href={sasUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  open
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</span>
            <p className="text-sm text-slate-700">
              {description || 'Vision did not return a caption for this image.'}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</span>
            {tags.length ? (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 8).map((tag) => (
                  <span key={tag.name} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {tag.name} · {formatConfidence(tag.confidence)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No tags detected.</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objects</span>
            {objects.length ? (
              <div className="space-y-1 text-sm text-slate-700">
                {objects.slice(0, 6).map((obj, index) => (
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
    </div>
  )
}
