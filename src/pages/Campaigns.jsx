import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Campaigns({ session }) {
  const [role, setRole] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [myApplications, setMyApplications] = useState([])

  useEffect(() => {
    async function load() {
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setRole(profile?.role)

      if (profile?.role === 'company') {
        // Load company's own campaigns
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('company_id', session.user.id)
          .order('created_at', { ascending: false })

        setCampaigns(data || [])
      } else {
        // Load all open campaigns for influencers
        const { data } = await supabase
          .from('campaigns')
          .select(`
            *,
            profiles:company_id (
              full_name,
              company_profiles (company_name)
            )
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false })

        setCampaigns(data || [])

        // Load my applications
        const { data: apps } = await supabase
          .from('applications')
          .select('campaign_id')
          .eq('influencer_id', session.user.id)

        setMyApplications((apps || []).map((a) => a.campaign_id))
      }

      setLoading(false)
    }

    load()
  }, [session])

  const handleApply = async (campaignId) => {
    setApplyingId(campaignId)
    setMessage(null)

    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId,
      influencer_id: session.user.id,
      status: 'pending',
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMyApplications((prev) => [...prev, campaignId])
      setMessage({ type: 'success', text: 'Application submitted successfully!' })
    }

    setApplyingId(null)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading campaigns...</p>
      </div>
    )
  }

  const isCompany = role === 'company'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCompany ? 'My Campaigns' : 'Browse Campaigns'}
          </h1>
          <p className="mt-1 text-gray-600">
            {isCompany
              ? 'Manage the campaigns you have posted'
              : 'Find paid collaboration opportunities'}
          </p>
        </div>

        {isCompany && (
          <Link
            to="/campaigns/create"
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            + Create Campaign
          </Link>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600">
            {isCompany
              ? 'You have not created any campaigns yet.'
              : 'No open campaigns available right now.'}
          </p>
          {isCompany && (
            <Link
              to="/campaigns/create"
              className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first campaign →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => {
            const alreadyApplied = myApplications.includes(campaign.id)
            const companyName =
              campaign.profiles?.company_profiles?.[0]?.company_name ||
              campaign.profiles?.full_name ||
              'Company'

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">{campaign.title}</h2>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          campaign.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    {!isCompany && (
                      <p className="text-sm text-gray-500 mb-2">by {companyName}</p>
                    )}

                    <p className="text-gray-600 text-sm whitespace-pre-line">{campaign.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(campaign.platforms || []).map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full"
                        >
                          {p}
                        </span>
                      ))}
                      {(campaign.niche || []).map((n) => (
                        <span
                          key={n}
                          className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    {campaign.budget && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-lg font-semibold text-gray-900">${campaign.budget}</p>
                      </div>
                    )}

                    {isCompany ? (
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        View Applications
                      </Link>
                    ) : (
                      campaign.status === 'open' && (
                        <button
                          onClick={() => handleApply(campaign.id)}
                          disabled={alreadyApplied || applyingId === campaign.id}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                            alreadyApplied
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {alreadyApplied
                            ? 'Applied'
                            : applyingId === campaign.id
                            ? 'Applying...'
                            : 'Apply Now'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}