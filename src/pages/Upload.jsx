import { useState } from 'react'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return

    try {
      setStatus('Requesting SAS URL...')
      // 1) Request a SAS URL from your FastAPI backend
      // const res = await fetch('/api/get-upload-sas', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ filename: file.name, contentType: file.type })
      // })
      // const { sasUrl, blobUrl, imageId } = await res.json()

      // 2) PUT the file to Blob Storage using the SAS URL
      // await fetch(sasUrl, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob' }, body: file })

      // 3) Notify backend of metadata (optional, if not included in step 1 response)
      // await fetch('/api/record-upload', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ imageId, blobUrl })
      // })

      setStatus('Uploaded! (wire up backend calls to make this real)')
    } catch (err) {
      console.error(err)
      setStatus('Upload failed — check console for details')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Upload an Image</h2>
      <form onSubmit={handleUpload} className="space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Upload
        </button>
      </form>
      <p className="text-sm text-slate-600">{status}</p>
    </div>
  )
}
