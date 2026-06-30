import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function SlideDetail() {
  const { id } = useParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSlide()
    if (user) checkLike()
  }, [id, user])

  async function fetchSlide() {
    const { data } = await supabase
      .from('slides')
      .select('*, profiles!slides_uploader_id_fkey(username, uploads_count, followers_count)')
      .eq('id', id)
      .single()
    setSlide(data)
    setLoading(false)
    if (data) {
      await supabase.from('slides')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)
    }
  }

  async function checkLike() {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('slide_id', id)
      .single()
    if (data) setLiked(true)
  }

  async function handleLike() {
    if (!user) { navigate('/auth'); return }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('slide_id', id)
      await supabase.from('slides').update({ likes: (slide.likes || 1) - 1 }).eq('id', id)
      setSlide(s => ({ ...s, likes: s.likes - 1 }))
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, slide_id: id })
      await supabase.from('slides').update({ likes: (slide.likes || 0) + 1 }).eq('id', id)
      setSlide(s => ({ ...s, likes: s.likes + 1 }))
      setLiked(true)
    }
  }

  async function handleDownload() {
    if (!user) { navigate('/auth'); return }
    await supabase.from('slides').update({ downloads: (slide.downloads || 0) + 1 }).eq('id', id)
    window.open(slide.file_url, '_blank')
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
      Loading…
    </div>
  )

  if (!slide) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
      Slide not found.
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text }}>

      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/')}
          style={{ fontSize: 20, fontWeight: 700, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: -0.5 }}>
          Slidea
        </button>
        <button onClick={() => navigate(-1)}
          style={{ fontSize: 13, color: theme.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 28 }}>
          📄
        </div>

        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{slide.title}</div>

        {slide.course_code && (
          <div style={{ fontSize: 13, color: theme.accent, fontWeight: 600, marginBottom: 12, letterSpacing: 0.5 }}>
            {slide.course_code}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {slide.faculty && (
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.accent }}>
              {slide.faculty.replace('Faculty of ', '')}
            </span>
          )}
          {slide.department && (
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>
              {slide.department}
            </span>
          )}
          {slide.level && (
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>
              {slide.level}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Downloads', value: slide.downloads || 0 },
            { label: 'Likes', value: slide.likes || 0 },
            { label: 'Views', value: slide.views || 0 },
          ].map(stat => (
            <div key={stat.label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div onClick={() => navigate(`/profile/${slide.profiles?.username}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 24, cursor: 'pointer' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
            {slide.profiles?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>@{slide.profiles?.username || 'unknown'}</div>
            <div style={{ fontSize: 12, color: theme.muted }}>{slide.profiles?.uploads_count || 0} uploads · {slide.profiles?.followers_count || 0} followers</div>
          </div>
          <div style={{ fontSize: 12, color: theme.accent }}>View profile →</div>
        </div>

        {slide.description && (
          <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.7, marginBottom: 28, padding: 16, background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}` }}>
            {slide.description}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <button onClick={handleLike}
            style={{ padding: '12px', borderRadius: 10, border: `1px solid ${liked ? theme.accent : theme.border}`, background: liked ? theme.accent : 'none', color: liked ? '#fff' : theme.text, fontSize: 14, cursor: 'pointer' }}>
            {liked ? '♡ Liked' : '♡ Like'}
          </button>
          <button onClick={handleShare}
            style={{ padding: '12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, fontSize: 14, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : '⎘ Share'}
          </button>
          <button onClick={handleDownload}
            style={{ padding: '12px', borderRadius: 10, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            ↓ Download
          </button>
        </div>

        {!user && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: theme.muted }}>
            <button onClick={() => navigate('/auth')}
              style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Log in
            </button>{' '}to download or like slides
          </div>
        )}
      </div>
    </div>
  )
}