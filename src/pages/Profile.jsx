import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Profile({ session }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [role, setRole] = useState(null)

  // Common
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  // Influencer fields
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [niche, setNiche] = useState('')
  const [ratePerPost, setRatePerPost] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [instagramFollowers, setInstagramFollowers] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [tiktokFollowers, setTiktokFollowers] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [facebookFollowers, setFacebookFollowers] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [linkedinFollowers, setLinkedinFollowers] = useState('')

  // Company fields
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setRole(profile.role)
      setFullName(profile.full_name || '')
      setEmail(profile.email || '')

      if (profile.role === 'influencer') {
        const { data: inf } = await supabase
          .from('influencer_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (inf) {
          setBio(inf.bio || '')
          setLocation(inf.location || '')
          setNiche((inf.niche || []).join(', '))
          setRatePerPost(inf.rate_per_post || '')
          setInstagramUrl(inf.instagram_url || '')
          setInstagramFollowers(inf.instagram_followers || '')
          setTiktokUrl(inf.tiktok_url || '')
          setTiktokFollowers(inf.tiktok_followers || '')
          setFacebookUrl(inf.facebook_url || '')
          setFacebookFollowers(inf.facebook_followers || '')
          setLinkedinUrl(inf.linkedin_url || '')
          setLinkedinFollowers(inf.linkedin_followers || '')
        }
      } else {
        const { data: comp } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (comp) {
          setCompanyName(comp.company_name || '')
          setWebsite(comp.website || '')
          setIndustry(comp.industry || '')
          setDescription(comp.description || '')
          setLocation(comp.location || '')
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [session])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Update common profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', session.user.id)

    if (profileError) {
      setMessage({ type: 'error', text: profileError.message })
      setSaving(false)
      return
    }

    if (role === 'influencer') {
      const nicheArray = niche
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)

      const { error } = await supabase
        .from('influencer_profiles')
        .upsert({
          id: session.user.id,
          bio,
          location,
          niche: nicheArray,
          rate_per_post: ratePerPost ? Number(ratePerPost) : null,
          instagram_url: instagramUrl,
          instagram_followers: instagramFollowers ? Number(instagramFollowers) : 0,
          tiktok_url: tiktokUrl,
          tiktok_followers: tiktokFollowers ? Number(tiktokFollowers) : 0,
          facebook_url: facebookUrl,
          facebook_followers: facebookFollowers ? Number(facebookFollowers) : 0,
          linkedin_url: linkedinUrl,
          linkedin_followers: linkedinFollowers ? Number(linkedinFollowers) : 0,
        })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    } else {
      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          id: session.user.id,
          company_name: companyName || fullName,
          website,
          industry,
          description,
          location,
        })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1 capitalize">{role} Account</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Dashboard
          </button>
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Common fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'company' ? 'Contact Name' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {role === 'influencer' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Tell brands about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niches (comma separated)
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Fashion, Lifestyle, Tech"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate per Post (USD)
                </label>
                <input
                  type="number"
                  value={ratePerPost}
                  onChange={(e) => setRatePerPost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="150"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Platforms</h3>

                <div className="space-y-4">
                  {/* Instagram */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                      <input
                        type="number"
                        value={instagramFollowers}
                        onChange={(e) => setInstagramFollowers(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
                      <input
                        type="url"
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                      <input
                        type="number"
                        value={tiktokFollowers}
                        onChange={(e) => setTiktokFollowers(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                      <input
                        type="number"
                        value={facebookFollowers}
                        onChange={(e) => setFacebookFollowers(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                      <input
                        type="number"
                        value={linkedinFollowers}
                        onChange={(e) => setLinkedinFollowers(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Fashion, Tech, Food..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Tell influencers about your brand..."
                />
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}