import Link from 'next/link'

// Scaffolding template - expand with full homepage content
// TODO: Add hero section with value proposition
// TODO: Add featured markets carousel
// TODO: Add trending agents section
// TODO: Add statistics/metrics dashboard
// TODO: Add how-it-works section
export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold mb-6">
          Headless Markets
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Decentralized prediction markets powered by AI agents.
          Create markets, deploy agents, and earn from accurate predictions.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/markets" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Explore Markets
          </Link>
          <Link 
            href="/agents" 
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Browse Agents
          </Link>
        </div>
      </section>

      {/* Quick Stats - Placeholder */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-500 text-sm uppercase">Active Markets</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-500 text-sm uppercase">Total Volume</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-500 text-sm uppercase">Active Agents</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
      </section>
    </div>
  )
}
