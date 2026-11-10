import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [extraProfile, setExtraProfile] = useState(null)
  const [stats, setStats] = useState({ campaigns: 0, applications: 0, deals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setProfile(data)

      // Load role-specific profile
      if (data.role === 'influencer') {
        const { data: inf } = await supabase
          .from('influencer_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setExtraProfile(inf)

        // Stats for influencer
        const { count: appsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('influencer_id', session.user.id)

        const { count: dealsCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('influencer_id', session.user.id)

        setStats({
          campaigns: 0,
          applications: appsCount || 0,
          deals: dealsCount || 0,
        })
      } else {
        const { data: comp } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setExtraProfile(comp)

        // Stats for company
        const { count: campsCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', session.user.id)

        const { count: dealsCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', session.user.id)

        setStats({
          campaigns: campsCount || 0,
          applications: 0,
          deals: dealsCount || 0,
        })
      }

      setLoading(false)
    }

    load()
  }, [session])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  const isInfluencer = profile?.role === 'influencer'

  const isProfileComplete = isInfluencer
    ? extraProfile?.bio && (extraProfile?.instagram_url || extraProfile?.tiktok_url)
    : extraProfile?.company_name && extraProfile?.description

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name || 'User'}!
          </h1>
          <p className="mt-1 text-gray-600">
            You are logged in as a <span className="font-semibold capitalize">{profile?.role}</span>
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          Edit Profile
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isInfluencer ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Applications Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.applications}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.deals}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Profile Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {isProfileComplete ? 'Complete' : 'Incomplete'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Campaigns Created</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.campaigns}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.deals}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Profile Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {isProfileComplete ? 'Complete' : 'Incomplete'}
              </p>
            </div>
          </>
        )}
      </div>

      {!isProfileComplete && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">Your profile is incomplete</p>
          <p className="text-amber-700 text-sm mt-1">
            {isInfluencer
              ? 'Add your bio and at least one social platform so brands can find you.'
              : 'Add your company name and description so influencers know who you are.'}
          </p>
          <Link to="/profile" className="inline-block mt-3 text-sm font-medium text-amber-800 underline">
            Complete your profile →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>

          {isInfluencer ? (
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Bio:</span> {extraProfile?.bio || 'Not set'}</p>
              <p><span className="text-gray-500">Location:</span> {extraProfile?.location || 'Not set'}</p>
              <p><span className="text-gray-500">Niches:</span> {(extraProfile?.niche || []).join(', ') || 'Not set'}</p>
              <p><span className="text-gray-500">Rate per post:</span> {extraProfile?.rate_per_post ? `$${extraProfile.rate_per_post}` : 'Not set'}</p>

              <div className="pt-3 border-t border-gray-100">
                <p className="font-medium text-gray-700 mb-2">Platforms</p>
                <div className="grid grid-cols-2 gap-2">
                  {extraProfile?.instagram_url && (
                    <p>Instagram: {extraProfile.instagram_followers?.toLocaleString() || 0} followers</p>
                  )}
                  {extraProfile?.tiktok_url && (
                    <p>TikTok: {extraProfile.tiktok_followers?.toLocaleString() || 0} followers</p>
                  )}
                  {extraProfile?.facebook_url && (
                    <p>Facebook: {extraProfile.facebook_followers?.toLocaleString() || 0} followers</p>
                  )}
                  {extraProfile?.linkedin_url && (
                    <p>LinkedIn: {extraProfile.linkedin_followers?.toLocaleString() || 0} followers</p>
                  )}
                  {!extraProfile?.instagram_url && !extraProfile?.tiktok_url && !extraProfile?.facebook_url && !extraProfile?.linkedin_url && (
                    <p className="text-gray-500">No platforms added yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Company:</span> {extraProfile?.company_name || 'Not set'}</p>
              <p><span className="text-gray-500">Industry:</span> {extraProfile?.industry || 'Not set'}</p>
              <p><span className="text-gray-500">Website:</span> {extraProfile?.website || 'Not set'}</p>
              <p><span className="text-gray-500">Location:</span> {extraProfile?.location || 'Not set'}</p>
              <p><span className="text-gray-500">Description:</span> {extraProfile?.description || 'Not set'}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/profile"
              className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-lg font-medium transition"
            >
              Edit Profile
            </Link>

            {isInfluencer ? (
              <>
                <Link
                  to="/campaigns"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition"
                >
                  Browse Campaigns
                </Link>
                <Link
                  to="/deals"
                  className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-lg font-medium transition"
                >
                  My Deals
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/campaigns/create"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition"
                >
                  Create Campaign
                </Link>
                <Link
                  to="/campaigns"
                  className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-lg font-medium transition"
                >
                  My Campaigns
                </Link>
                <Link
                  to="/deals"
                  className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-lg font-medium transition"
                >
                  My Deals
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}