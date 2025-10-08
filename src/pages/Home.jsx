export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Welcome to Fish AI</h2>
      <p>
        Upload a fish image and get a species prediction powered by an AKS-hosted model.
      </p>
      <ul className="list-disc pl-6 text-slate-700">
        <li>Secure upload via SAS URL issuance (from FastAPI backend)</li>
        <li>Async processing via Service Bus + Functions</li>
        <li>Low-latency inference on AKS (GPU)</li>
      </ul>
    </div>
  )
}
