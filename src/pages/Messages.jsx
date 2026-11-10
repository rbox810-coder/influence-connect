import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Messages({ session }) {
  const [searchParams] = useSearchParams()
  const otherUserId = searchParams.get('user')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Load conversations list
  useEffect(() => {
    async function loadConversations() {
      // Get all messages involving the current user
      const { data: allMessages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          sender:sender_id (full_name, role),
          receiver:receiver_id (full_name, role)
        `)
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })

      if (!allMessages) {
        setLoading(false)
        return
      }

      // Group by the other user
      const convMap = new Map()

      allMessages.forEach((msg) => {
        const otherId =
          msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id
        const otherProfile =
          msg.sender_id === session.user.id ? msg.receiver : msg.sender

        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            userId: otherId,
            name: otherProfile?.full_name || 'User',
            role: otherProfile?.role,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
          })
        }
      })

      setConversations(Array.from(convMap.values()))
      setLoading(false)
    }

    loadConversations()
  }, [session])

  // Load messages with a specific user
  useEffect(() => {
    if (!otherUserId) {
      setMessages([])
      setOtherUser(null)
      return
    }

    async function loadChat() {
      // Get other user info
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', otherUserId)
        .single()

      setOtherUser(userData)

      // Get messages between the two users
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session.user.id})`
        )
        .order('created_at', { ascending: true })

      setMessages(data || [])
    }

    loadChat()

    // Realtime subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new
          if (
            (msg.sender_id === session.user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === session.user.id)
          ) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUserId, session])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !otherUserId) return

    setSending(true)

    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: otherUserId,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No conversations yet.
                  <p className="mt-2">Start by accepting a deal or applying to a campaign.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <Link
                    key={conv.userId}
                    to={`/messages?user=${conv.userId}`}
                    className={`block p-4 border-b border-gray-50 hover:bg-gray-50 transition ${
                      otherUserId === conv.userId ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{conv.name}</p>
                      <span className="text-xs text-gray-400 capitalize">{conv.role}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="hidden md:flex flex-1 flex-col">
            {!otherUserId ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{otherUser?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{otherUser?.role}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === session.user.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                          <p
                            className={`text-[10px] mt-1 ${
                              isMe ? 'text-indigo-200' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-medium transition disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Show chat when a user is selected */}
      {otherUserId && (
        <div className="md:hidden mt-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '60vh' }}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <Link to="/messages" className="text-indigo-600 text-sm">← Back</Link>
              <div>
                <p className="font-semibold text-gray-900">{otherUser?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{otherUser?.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}