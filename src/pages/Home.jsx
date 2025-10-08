import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Upload Instantly',
    description:
      'Drop in any fish photo from your camera roll or desktop and we will securely store it in Azure Blob Storage.'
  },
  {
    title: 'AI-Powered Detection',
    description:
      'Azure AI Vision analyzes species, surroundings, and key attributes within seconds so you can act quickly.'
  },
  {
    title: 'Shareable Insights',
    description:
      'Each upload returns a time-limited SAS link, making it safe to share the analyzed image with collaborators.'
  }
]

const steps = [
  { number: 1, label: 'Select a fish image you want to identify.' },
  { number: 2, label: 'We upload to Azure and run Vision analysis.' },
  { number: 3, label: 'Review species hints, tags, and confidence scores.' }
]

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-sky-100 via-white to-blue-100 p-10 shadow-sm">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-1 text-sm text-sky-700">
            <span className="font-semibold uppercase tracking-wide">New</span>
            <span>Azure-powered fish recognition in your browser</span>
          </div>
          <h2 className="text-4xl font-semibold text-slate-900">
            Identify fish species in seconds with Fish AI
          </h2>
          <p className="text-lg text-slate-700">
            Fish AI combines Azure Blob Storage and Azure AI Vision so you can upload a single image and receive
            rich insights instantly. Perfect for anglers, researchers, aquaculture teams, and hobbyists tracking their catches.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700"
            >
              Upload an Image
            </Link>
            <Link
              to="/results"
              className="inline-flex items-center justify-center rounded-full border border-blue-200 px-6 py-3 text-blue-700 hover:bg-blue-50"
            >
              View Recent Analysis
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-slate-900">How it works</h3>
          <p className="text-sm text-slate-600">
            Fish AI leverages serverless Azure Functions to handle uploads and Vision inference. Every request receives a secure SAS link that automatically expires after one hour.
          </p>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                  {step.number}
                </span>
                <p className="text-sm text-slate-700">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900">Why anglers love Fish AI</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>• Cloud storage keeps your full-resolution images safe and private.</li>
            <li>• Vision analysis surfaces likely species and habitat indicators.</li>
            <li>• Share read-only SAS URLs with friends, students, or field partners.</li>
            <li>• Works seamlessly on desktop and mobile devices.</li>
          </ul>
          <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-slate-100">
            Pro tip: Capture multiple angles of your fish. Upload the clearest image first to get the most accurate confidence scores.
          </div>
        </div>
      </section>
    </div>
  )
}
