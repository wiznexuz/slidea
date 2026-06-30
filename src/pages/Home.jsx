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

  const faculties = ['All', 'Faculty of Administration', 'Faculty of Agriculture', 'Faculty of Arts', 'Faculty of Computing Science and Engineering', 'Faculty of Education', 'Faculty of Environmental Design and Management', 'Faculty of Law', 'Faculty of Pharmacy', 'Faculty of Sciences', 'Faculty of Social Sciences', 'Faculty of Technology']
  const themeLabels = { light: 'Light mode ☀️', dark: 'Dark mode 🌙', gold: 'Gold mode ✦' }

  useEffect(() => {
    fetchSlides()
  }, [faculty])

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

  const filtered = slides.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.course_code?.toLowerCase().includes(search.toLowerCase())
  )

  const trending = [...slides]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 4)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontSize: 14 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text }}>

      {/* Navbar */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent, letterSpacing: -0.5 }}>Slidea</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleTheme}
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, padding: '6px 12px', color: theme.text, whiteSpace: 'nowrap' }}>
            {themeLabels[mode]}
          </button>
          {user ? (
            <>
              <button onClick={() => navigate('/upload')}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer' }}>
                Upload
              </button>
              <button onClick={async () => {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()
  if (data?.username) navigate(`/profile/${data.username}`)
}}
  style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer' }}>
  Profile
</button>
              <button onClick={handleLogout}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', cursor: 'pointer' }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/auth')}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer' }}>
                Log in
              </button>
              <button onClick={() => navigate('/auth')}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', cursor: 'pointer' }}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero — different for logged in vs logged out */}
      {user ? (
        <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '28px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Welcome back, @{user.user_metadata?.username || 'student'} 👋
              </div>
              <div style={{ fontSize: 14, color: theme.muted, marginBottom: 2 }}>
                {user.user_metadata?.department
                  ? `${user.user_metadata.department}${user.user_metadata.level ? ` · ${user.user_metadata.level}` : ''}`
                  : 'What are you studying today?'
                }
              </div>
              {user.user_metadata?.faculty && (
                <div style={{ fontSize: 12, color: theme.accent }}>
                  {user.user_metadata.faculty}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search slides, courses, uploaders…"
                style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', width: 280 }}
              />
              <button onClick={() => navigate('/upload')}
                style={{ padding: '10px 20px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                + Upload
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Hero */}
          <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '72px 24px 56px' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 1, color: theme.accent, background: theme.bg, border: `1px solid ${theme.accent}`, borderRadius: 20, padding: '4px 14px', marginBottom: 20, textTransform: 'uppercase' }}>
                Free for all students
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 14, lineHeight: 1.15, color: theme.text }}>
                The lecture slide library<br />built for students.
              </div>
              <div style={{ fontSize: 16, color: theme.muted, marginBottom: 36, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
                Browse and share lecture slides, past questions and course notes — all in one place. Free to browse. Login to download and upload.
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '0 auto 16px' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by title, course code or uploader…"
                  style={{ flex: 1, padding: '13px 16px', borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none' }}
                />
                <button style={{ padding: '13px 20px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Search
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
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
          <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '20px 24px', background: theme.bg }}>
            <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              {[
                { value: slides.length + '+', label: 'Slides uploaded' },
                { value: '11', label: 'Faculties covered' },
                { value: '100%', label: 'Free to browse' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '48px 24px', background: theme.surface }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>How Slidea works</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
                {[
                  { step: '01', title: 'Search freely', desc: 'Browse thousands of lecture slides by faculty, department or course code — no account needed.' },
                  { step: '02', title: 'Login to download', desc: 'Create a free account in seconds. Download any slide instantly once you\'re logged in.' },
                  { step: '03', title: 'Upload & share', desc: 'Share your own notes with other students. Build your profile and gain followers.' },
                ].map(item => (
                  <div key={item.step} style={{ padding: 24, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 14 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent, opacity: 0.3, marginBottom: 10 }}>{item.step}</div>
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
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto', background: theme.bg }}>
        {faculties.map(f => (
          <button key={f} onClick={() => setFaculty(f)}
            style={{ padding: '12px 14px', fontSize: 12, background: 'none', border: 'none', borderBottom: faculty === f ? `2px solid ${theme.accent}` : '2px solid transparent', color: faculty === f ? theme.accent : theme.muted, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: faculty === f ? 500 : 400 }}>
            {f === 'All' ? 'All' : f.replace('Faculty of ', '')}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Trending */}
        {!search && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Trending this week</div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {trending.length === 0 ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ minWidth: 160, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: theme.border, marginBottom: 8 }}>0{i}</div>
                    <div style={{ height: 12, background: theme.border, borderRadius: 4, marginBottom: 6 }}></div>
                    <div style={{ height: 10, background: theme.border, borderRadius: 4, width: '60%' }}></div>
                  </div>
                ))
              ) : trending.map((s, i) => (
                <div key={s.id} onClick={() => navigate(`/slides/${s.id}`)}
                  style={{ minWidth: 160, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent, opacity: 0.4, marginBottom: 8 }}>0{i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{s.course_code && `${s.course_code} · `}{s.faculty?.replace('Faculty of ', '')} · {s.downloads || 0} downloads</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {search ? `Results for "${search}"` : 'Recently uploaded'}
        </div>

        {loading ? (
          <div style={{ color: theme.muted, fontSize: 14, textAlign: 'center', padding: '48px 0' }}>Loading slides…</div>
        ) : filtered.length === 0 ? (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map(slide => (
              <div key={slide.id} onClick={() => navigate(`/slides/${slide.id}`)}
                style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
                <div style={{ height: 110, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
  {slide.file_url?.includes('.pptx') || slide.file_url?.includes('.ppt') ? '📊' : slide.file_url?.includes('.docx') || slide.file_url?.includes('.doc') ? '📝' : '📄'}
</div>
                <div style={{ padding: '12px 14px' }}>
                  {slide.course_code && (
                    <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginBottom: 3, letterSpacing: 0.5 }}>
                      {slide.course_code}
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{slide.title}</div>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>by @{slide.profiles?.username || 'unknown'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, background: theme.surface, color: theme.accent, padding: '3px 8px', borderRadius: 6, border: `1px solid ${theme.border}` }}>
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