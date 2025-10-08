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
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const dataUrl = await readFileAsDataUrl(nextFile)
      setPreview(dataUrl)
    } catch (err) {
      console.error('Failed to read file preview', err)
      setPreview(null)
      setError('Unable to read the selected file. Please choose a different image.')
    }
  }

  const clearSelection = () => {
    setFile(null)
    setPreview(null)
    setStatus('')
    setError('')
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) return

    setIsSubmitting(true)
    setError('')

    try {
      setStatus('Uploading image to Azure Blob Storage...')

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
        const message = payload.error || `Upload failed with status ${response.status}.`
        throw new Error(message)
      }

      setStatus('Analysis complete. Redirecting to results...')

      const prediction = {
        ...payload,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        previewDataUrl: dataUrl
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prediction))
      }

      navigate('/results', { state: { prediction } })
    } catch (err) {
      console.error('Upload failed', err)
      setError(err.message || 'Upload failed. Check console for details.')
      setStatus('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Upload an Image</h2>
        <p className="text-sm text-slate-600">
          Your image will be stored in Azure Blob Storage, analyzed with Azure AI Vision, and summarized for you moments later.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block text-sm"
          />
          {preview && (
            <img
              src={preview}
              alt="Selected upload preview"
              className="max-h-64 rounded border bg-white object-contain p-2 shadow-sm"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!file || isSubmitting}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-xs text-slate-500">
        Analysis typically completes in a few seconds. SAS links we return stay active for one hour so you can share the result if needed.
      </div>
    </div>
  )
}
