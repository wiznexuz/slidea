import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { theme, mode, toggleTheme } = useTheme()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [slides, setSlides] = useState([])
  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState('All')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const faculties = [
    'All',
    'Faculty of Administration',
    'Faculty of Agriculture',
    'Faculty of Arts',
    'Faculty of Computing Science and Engineering',
    'Faculty of Education',
    'Faculty of Environmental Design and Management',
    'Faculty of Law',
    'Faculty of Pharmacy',
    'Faculty of Sciences',
    'Faculty of Social Sciences',
    'Faculty of Technology',
  ]

  const themeLabels = { light: '☀️ Light', dark: '🌙 Dark', gold: '✦ Gold' }

  useEffect(() => {
    fetchSlides()
  }, [faculty])

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, avatar_public')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  async function fetchSlides() {
    setLoading(true)
    let query = supabase
      .from('slides')
      .select('id, title, faculty, department, course_code, downloads, likes, views, created_at, file_url, uploader_id, profiles!slides_uploader_id_fkey(username)')
      .order('created_at', { ascending: false })
    if (faculty !== 'All') query = query.eq('faculty', faculty)
    const { data, error } = await query
    if (error) console.error('Fetch error:', error.message)
    setSlides(data || [])
    setLoading(false)
  }

  async function handleSearch(val) {
    setSearch(val)
    if (!val.trim()) { fetchSlides(); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('slides')
      .select('id, title, faculty, department, course_code, downloads, likes, views, created_at, file_url, uploader_id, profiles!slides_uploader_id_fkey(username)')
      .or(`title.ilike.%${val}%,course_code.ilike.%${val}%,department.ilike.%${val}%`)
      .order('created_at', { ascending: false })
    if (error) console.error(error.message)
    setSlides(data || [])
    setLoading(false)
  }

  const trending = [...slides]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 4)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function fileIcon(url) {
    if (!url) return '📄'
    if (url.includes('.pptx') || url.includes('.ppt')) return '📊'
    if (url.includes('.docx') || url.includes('.doc')) return '📝'
    return '📄'
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontSize: 14 }}>
      Loading…
    </div>
  )

  const showAvatar = profile?.avatar_url && profile?.avatar_public !== false
  const initials = (profile?.username || user?.user_metadata?.username || 'S')[0].toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, overflowX: 'hidden' }}>

      {/* Navbar */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent, letterSpacing: -0.5, flexShrink: 0 }}>Slidea</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={toggleTheme}
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 11, padding: '5px 8px', color: theme.text, whiteSpace: 'nowrap' }}>
            {themeLabels[mode]}
          </button>
          {user ? (
            <>
              <button onClick={() => navigate('/upload')}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Upload
              </button>
              <div
                onClick={() => profile?.username && navigate(`/profile/${profile.username}`)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', overflow: 'hidden', flexShrink: 0, border: `2px solid ${theme.border}` }}>
                {showAvatar
                  ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <button onClick={handleLogout}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/auth')}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Log in
              </button>
              <button onClick={() => navigate('/auth')}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero */}
      {user ? (
        <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '20px 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Welcome back, @{profile?.username || user.user_metadata?.username || 'student'} 👋
              </div>
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 2 }}>
                {user.user_metadata?.department
                  ? `${user.user_metadata.department}${user.user_metadata.level ? ` · ${user.user_metadata.level}` : ''}`
                  : 'What are you studying today?'}
              </div>
              {user.user_metadata?.faculty && (
                <div style={{ fontSize: 12, color: theme.accent }}>{user.user_metadata.faculty}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search slides, courses, uploaders…"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', minWidth: 0, boxSizing: 'border-box' }}
              />
              <button onClick={() => navigate('/upload')}
                style={{ padding: '10px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                + Upload
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Landing hero */}
          <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '48px 16px 40px' }}>
            <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 1, color: theme.accent, background: theme.bg, border: `1px solid ${theme.accent}`, borderRadius: 20, padding: '4px 14px', marginBottom: 16, textTransform: 'uppercase' }}>
                Free for all students
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2, color: theme.text }}>
                The lecture slide library<br />built for students.
              </div>
              <div style={{ fontSize: 14, color: theme.muted, marginBottom: 28, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 28px' }}>
                Browse and share lecture slides, past questions and course notes — all in one place. Free to browse. Login to download and upload.
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto 14px', boxSizing: 'border-box' }}>
                <input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by title, course code or uploader…"
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', minWidth: 0, boxSizing: 'border-box' }}
                />
                <button style={{ padding: '12px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Search
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/auth')}
                  style={{ padding: '10px 24px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Get started free
                </button>
                <button onClick={() => navigate('/auth')}
                  style={{ padding: '10px 24px', background: 'none', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                  Log in
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '16px', background: theme.bg }}>
            <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              {[
                { value: `${slides.length}+`, label: 'Slides uploaded' },
                { value: '11', label: 'Faculties covered' },
                { value: '100%', label: 'Free to browse' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '40px 16px', background: theme.surface }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', marginBottom: 28 }}>How Slidea works</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { step: '01', title: 'Search freely', desc: 'Browse thousands of slides by faculty, department or course code — no account needed.' },
                  { step: '02', title: 'Login to download', desc: 'Create a free account in seconds. Download any slide instantly once logged in.' },
                  { step: '03', title: 'Upload & share', desc: 'Share your notes with other students. Build your profile and gain followers.' },
                ].map(item => (
                  <div key={item.step} style={{ padding: 20, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 14 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent, opacity: 0.3, marginBottom: 8 }}>{item.step}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty filters */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 8px', display: 'flex', gap: 0, overflowX: 'auto', background: theme.bg, scrollbarWidth: 'none' }}>
        {faculties.map(f => (
          <button key={f} onClick={() => setFaculty(f)}
            style={{ padding: '12px 12px', fontSize: 12, background: 'none', border: 'none', borderBottom: faculty === f ? `2px solid ${theme.accent}` : '2px solid transparent', color: faculty === f ? theme.accent : theme.muted, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: faculty === f ? 600 : 400, flexShrink: 0 }}>
            {f === 'All' ? 'All' : f.replace('Faculty of ', '')}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Trending */}
        {!search && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Trending this week</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {trending.length === 0 ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ minWidth: 150, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14, flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: theme.border, marginBottom: 8 }}>0{i}</div>
                    <div style={{ height: 10, background: theme.border, borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ height: 8, background: theme.border, borderRadius: 4, width: '60%' }} />
                  </div>
                ))
              ) : trending.map((s, i) => (
                <div key={s.id} onClick={() => navigate(`/slides/${s.id}`)}
                  style={{ minWidth: 150, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent, opacity: 0.4, marginBottom: 6 }}>0{i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>
                    {s.course_code && `${s.course_code} · `}
                    {s.faculty?.replace('Faculty of ', '')} · {s.downloads || 0} downloads
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          {search ? `Results for "${search}"` : 'Recently uploaded'}
        </div>

        {loading ? (
          <div style={{ color: theme.muted, fontSize: 14, textAlign: 'center', padding: '48px 0' }}>Loading slides…</div>
        ) : slides.length === 0 ? (
          <div style={{ color: theme.muted, fontSize: 14, textAlign: 'center', padding: '48px 0' }}>
            No slides found.{' '}
            {user ? (
              <button onClick={() => navigate('/upload')}
                style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Be the first to upload one.
              </button>
            ) : (
              <button onClick={() => navigate('/auth')}
                style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Log in to upload one.
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {slides.map(slide => (
              <div key={slide.id} onClick={() => navigate(`/slides/${slide.id}`)}
                style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
                <div style={{ height: 90, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {fileIcon(slide.file_url)}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  {slide.course_code && (
                    <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginBottom: 3, letterSpacing: 0.5 }}>
                      {slide.course_code}
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {slide.title}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>
                    by @{slide.profiles?.username || 'unknown'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, background: theme.surface, color: theme.accent, padding: '2px 7px', borderRadius: 6, border: `1px solid ${theme.border}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {slide.faculty?.replace('Faculty of ', '') || 'General'}
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted }}>♡ {slide.likes || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}