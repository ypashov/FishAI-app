import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'fishai:lastPrediction'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })
}

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleFileChange = async (event) => {
    const nextFile = event.target.files?.[0] || null
    setFile(nextFile)
    setStatus('')
    setError('')

    if (!nextFile) {
      setPreview(null)
      return
    }

    try {
      setPreview(await readFileAsDataUrl(nextFile))
    } catch (err) {
      console.error(err)
      setPreview(null)
      setError('Could not preview this file.')
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setStatus('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file || busy) return

    setBusy(true)
    setError('')
    setStatus('Uploading...')

    try {
      const dataUrl = preview || (await readFileAsDataUrl(file))
      const response = await fetch('/api/upload-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          data: dataUrl
        })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || `Upload failed (${response.status})`)
      }

      const prediction = {
        id: payload.id || payload.blobName || `${Date.now()}-${file.name}`,
        ...payload,
        fileName: file.name,
        previewDataUrl: dataUrl
      }

      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(prediction))
      setStatus('Done! Redirecting...')
      navigate('/results', { state: { prediction } })
    } catch (err) {
      console.error(err)
      setStatus('')
      setError(err.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-50">Upload & analyze</h2>
        <p className="text-sm text-slate-400">Select a single image to run through Azure Vision.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-950 hover:border-slate-500"
          />
          {preview && (
            <img
              src={preview}
              alt="Selected preview"
              className="max-h-64 w-full rounded-lg border border-slate-800 bg-slate-950/80 object-contain p-2"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!file || busy}
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-400"
          >
            {busy ? 'Analyzing...' : 'Upload image'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
          >
            Clear
          </button>
        </div>
      </form>

      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
