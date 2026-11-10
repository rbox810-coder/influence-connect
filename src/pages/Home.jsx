import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Connect Influencers with Brands
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          The simplest platform for paid collaborations on Instagram, TikTok, Facebook & LinkedIn.
          Companies post campaigns. Influencers apply. We take only 5%.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold transition"
          >
            Login
          </Link>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">For Influencers</h3>
          <p className="mt-2 text-gray-600">
            Create your profile, showcase your audience, and apply to paid brand campaigns.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">For Companies</h3>
          <p className="mt-2 text-gray-600">
            Post campaigns, find the right creators, and manage collaborations easily.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Only 5% Fee</h3>
          <p className="mt-2 text-gray-600">
            Transparent pricing. We only take 5% when a paid collaboration happens.
          </p>
        </div>
      </div>
    </div>
  )
}