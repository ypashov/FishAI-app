import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'fishai:lastPrediction'

function getStoredPrediction() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('Failed to parse stored prediction', err)
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

  const initialPrediction = useMemo(() => {
    return location.state?.prediction || getStoredPrediction()
  }, [location.state])

  const [prediction, setPrediction] = useState(initialPrediction)
  const [activeImageSrc, setActiveImageSrc] = useState(
    initialPrediction?.sasUrl || initialPrediction?.previewDataUrl || ''
  )

  useEffect(() => {
    if (location.state?.prediction) {
      setPrediction(location.state.prediction)
      const nextSrc =
        location.state.prediction.sasUrl || location.state.prediction.previewDataUrl || ''
      setActiveImageSrc(nextSrc)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location.state.prediction))
      }
    }
  }, [location.state])

  useEffect(() => {
    if (!prediction) return
    const nextSrc = prediction.sasUrl || prediction.previewDataUrl || ''
    setActiveImageSrc(nextSrc)
  }, [prediction])

  const handleImageError = () => {
    if (prediction?.previewDataUrl && activeImageSrc !== prediction.previewDataUrl) {
      setActiveImageSrc(prediction.previewDataUrl)
    }
  }

  const handleUploadAnother = () => navigate('/upload')

  if (!prediction) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Results</h2>
        <p>No analysis found yet. Upload an image to get started.</p>
        <button
          type="button"
          onClick={handleUploadAnother}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Upload an Image
        </button>
      </div>
    )
  }

  const {
    description,
    tags = [],
    objects = [],
    analyzedAt,
    fileName,
    sasUrl,
    previewDataUrl
  } = prediction

  const analysisTime = analyzedAt ? new Date(analyzedAt).toLocaleString() : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Analysis Result</h2>
          <p className="text-sm text-slate-600">
            We analyzed your image using Azure AI Vision and stored it securely in Blob Storage.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUploadAnother}
          className="self-start px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Analyze Another Image
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-3 shadow-sm">
            {activeImageSrc ? (
              <img
                src={activeImageSrc}
                alt={fileName || 'Uploaded image'}
                onError={handleImageError}
                className="w-full max-h-[480px] rounded object-contain"
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded border border-dashed text-slate-500">
                No preview available.
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            {fileName && <div><span className="font-medium">Filename:</span> {fileName}</div>}
            {analysisTime && (
              <div>
                <span className="font-medium">Analyzed:</span> {analysisTime}
              </div>
            )}
            {sasUrl && (
              <div>
                <span className="font-medium">Blob SAS URL:</span>{' '}
                <a
                  href={sasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>{' '}
                (expires ~1 hour after upload)
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-lg font-semibold">Azure AI Summary</h3>
            <p className="text-slate-700">
              {description || 'Azure Vision did not return a description for this image.'}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Top Tags</h3>
              {tags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.slice(0, 10).map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm text-blue-700"
                    >
                      {tag.name} · {formatConfidence(tag.confidence)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No tags detected.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold">Detected Objects</h3>
              {objects.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {objects.map((obj, index) => (
                    <li key={`${obj.name}-${index}`}>
                      {obj.name} · {formatConfidence(obj.confidence)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">No specific objects detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        SAS URLs expire after about an hour. If the preview stops working later, re-upload the image or use the locally cached copy.
      </div>
    </div>
  )
}
