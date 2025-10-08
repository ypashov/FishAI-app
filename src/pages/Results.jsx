import { useEffect, useState } from 'react'

export default function Results() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      // Example: const res = await fetch('/api/predictions?limit=25')
      // setItems(await res.json())
    }
    fetchResults().finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (!items.length) return <p>No results yet. Upload an image to get started.</p>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recent Predictions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="rounded-lg border bg-white p-3">
            <img src={item.thumbnailUrl} alt={item.species} className="w-full h-40 object-cover rounded"/>
            <div className="mt-2">
              <div className="font-medium">{item.species} <span className="text-xs text-slate-500">({Math.round(item.confidence*100)}%)</span></div>
              <div className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
