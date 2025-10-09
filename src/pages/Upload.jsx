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
      setError('Could not preview this file. Try a different image.')
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
    setStatus('Uploading…')

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
        ...payload,
        fileName: file.name,
        previewDataUrl: dataUrl
      }

      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(prediction))
      setStatus('Done! Redirecting…')
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
    <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Upload & analyze</h2>
        <p className="text-sm text-slate-500">Select one clear fish photo to run Azure Vision.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm"
          />
          {preview && (
            <img
              src={preview}
              alt="Selected preview"
              className="max-h-64 w-full rounded-lg border border-slate-200 object-contain bg-white p-2"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!file || busy}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:text-slate-100"
          >
            {busy ? 'Analyzing…' : 'Upload image'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {status && <p className="mt-4 text-sm text-slate-600">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
