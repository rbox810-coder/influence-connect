import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error(error)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    getProfile()
  }, [session])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.full_name || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          You are logged in as a <span className="font-semibold capitalize">{profile?.role}</span>.
        </p>

        <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
          <p className="text-indigo-800">
            {profile?.role === 'influencer'
              ? 'Next step: Complete your influencer profile (platforms, followers, rates) so brands can find you.'
              : 'Next step: Create your first campaign to start receiving applications from influencers.'}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900">Your Profile</h3>
            <p className="mt-2 text-sm text-gray-600">Email: {profile?.email}</p>
            <p className="text-sm text-gray-600">Role: {profile?.role}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900">Coming Soon</h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>• Complete profile</li>
              <li>• Browse / Create campaigns</li>
              <li>• Messaging</li>
              <li>• Deals & 5% commission tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}