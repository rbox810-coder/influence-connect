import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CampaignDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    async function load() {
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setRole(profile?.role)

      // Load campaign
      const { data: camp, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !camp) {
        setLoading(false)
        return
      }

      setCampaign(camp)

      // Only company owner can see applications
      if (camp.company_id === session.user.id) {
        const { data: apps } = await supabase
          .from('applications')
          .select(`
            *,
            profiles:influencer_id (
              full_name,
              email,
              influencer_profiles (
                bio,
                instagram_url,
                instagram_followers,
                tiktok_url,
                tiktok_followers,
                rate_per_post
              )
            )
          `)
          .eq('campaign_id', id)
          .order('created_at', { ascending: false })

        setApplications(apps || [])
      }

      setLoading(false)
    }

    load()
  }, [id, session])

  const handleAccept = async (application) => {
    setActionLoading(application.id)
    setMessage(null)

    // 1. Update application status
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', application.id)

    if (appError) {
      setMessage({ type: 'error', text: appError.message })
      setActionLoading(null)
      return
    }

    // 2. Create a deal
    const dealAmount = campaign.budget || application.profiles?.influencer_profiles?.[0]?.rate_per_post || 0
    const platformFee = Math.round(dealAmount * 0.05 * 100) / 100 // 5%
    const influencerAmount = dealAmount

    const { error: dealError } = await supabase.from('deals').insert({
      campaign_id: campaign.id,
      application_id: application.id,
      company_id: session.user.id,
      influencer_id: application.influencer_id,
      amount: dealAmount,
      platform_fee: platformFee,
      influencer_payout: influencerAmount,
      status: 'active',
    })

    if (dealError) {
      setMessage({ type: 'error', text: 'Application accepted but failed to create deal: ' + dealError.message })
    } else {
      setMessage({
        type: 'success',
        text: `Application accepted! Deal created. Platform fee (5%): $${platformFee}. Influencer receives: $${influencerAmount}.`,
      })

      // Refresh applications
      setApplications((prev) =>
        prev.map((a) =>
          a.id === application.id ? { ...a, status: 'accepted' } : a
        )
      )
    }

    setActionLoading(null)
  }

  const handleReject = async (applicationId) => {
    setActionLoading(applicationId)
    setMessage(null)

    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Application rejected.' })
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, status: 'rejected' } : a
        )
      )
    }

    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-gray-600">Campaign not found.</p>
        <Link to="/campaigns" className="text-indigo-600 mt-4 inline-block">← Back to Campaigns</Link>
      </div>
    )
  }

  const isOwner = campaign.company_id === session.user.id

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/campaigns')}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6"
      >
        ← Back to Campaigns
      </button>

      {/* Campaign Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <span
              className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                campaign.status === 'open'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {campaign.status}
            </span>
          </div>
          {campaign.budget && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-xl font-semibold text-gray-900">${campaign.budget}</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-gray-600 whitespace-pre-line">{campaign.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(campaign.platforms || []).map((p) => (
            <span key={p} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              {p}
            </span>
          ))}
          {(campaign.niche || []).map((n) => (
            <span key={n} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {n}
            </span>
          ))}
        </div>
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

      {/* Applications (only for company owner) */}
      {isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Applications ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const influencer = app.profiles
                const infProfile = influencer?.influencer_profiles?.[0]

                return (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {influencer?.full_name || 'Influencer'}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              app.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : app.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">{influencer?.email}</p>

                        {infProfile?.bio && (
                          <p className="text-sm text-gray-600 mt-2">{infProfile.bio}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                          {infProfile?.instagram_url && (
                            <span>
                              Instagram: {infProfile.instagram_followers?.toLocaleString() || 0} followers
                            </span>
                          )}
                          {infProfile?.tiktok_url && (
                            <span>
                              TikTok: {infProfile.tiktok_followers?.toLocaleString() || 0} followers
                            </span>
                          )}
                          {infProfile?.rate_per_post && (
                            <span>Rate: ${infProfile.rate_per_post}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(app)}
                              disabled={actionLoading === app.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                            >
                              {actionLoading === app.id ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={actionLoading === app.id}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        <Link
                          to={`/messages?user=${app.influencer_id}`}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition text-center"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-600">You can only view applications for campaigns you created.</p>
        </div>
      )}
    </div>
  )
}