import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Deals({ session }) {
  const [deals, setDeals] = useState([])
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setRole(profile?.role)

      // Load deals where user is company or influencer
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          campaign:campaign_id (title, budget),
          company:company_id (full_name, company_profiles(company_name)),
          influencer:influencer_id (full_name)
        `)
        .or(`company_id.eq.${session.user.id},influencer_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setDeals(data || [])
      }

      setLoading(false)
    }

    load()
  }, [session])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading deals...</p>
      </div>
    )
  }

  const isCompany = role === 'company'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Deals</h1>
        <p className="mt-1 text-gray-600">
          {isCompany
            ? 'All collaborations you have accepted with influencers'
            : 'All collaborations brands have accepted with you'}
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600">No deals yet.</p>
          <Link
            to="/campaigns"
            className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isCompany ? 'Go to your campaigns →' : 'Browse campaigns →'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const campaignTitle = deal.campaign?.title || 'Campaign'
            const otherPartyName = isCompany
              ? deal.influencer?.full_name || 'Influencer'
              : deal.company?.company_profiles?.[0]?.company_name ||
                deal.company?.full_name ||
                'Company'

            const otherUserId = isCompany ? deal.influencer_id : deal.company_id

            return (
              <div
                key={deal.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold text-gray-900">{campaignTitle}</h2>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          deal.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : deal.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      {isCompany ? 'Influencer' : 'Company'}: <span className="font-medium text-gray-700">{otherPartyName}</span>
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(deal.created_at).toLocaleDateString()}
                    </p>

                    <Link
                      to={`/messages?user=${otherUserId}`}
                      className="inline-block mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Message {isCompany ? 'Influencer' : 'Company'} →
                    </Link>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 min-w-[200px]">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deal Amount</span>
                        <span className="font-medium">${Number(deal.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Platform Fee (5%)</span>
                        <span className="font-medium text-indigo-600">${Number(deal.platform_fee).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="text-gray-700 font-medium">
                          {isCompany ? 'You pay' : 'You receive'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ${isCompany
                            ? (Number(deal.amount) + Number(deal.platform_fee)).toLocaleString()
                            : Number(deal.influencer_payout).toLocaleString()}
                        </span>
                      </div>
                    </div>
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