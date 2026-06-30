import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const facultyDepartments = {
  'Faculty of Administration': ['Accounting', 'Business Administration', 'International Relations', 'Local Government and Development Studies', 'Public Administration'],
  'Faculty of Agriculture': ['Agricultural Economics', 'Animal Sciences', 'Crop Production and Protection', 'Family Nutrition and Consumer Sciences', 'Plant Science', 'Soil Science', 'Agricultural Extension and Rural Development'],
  'Faculty of Arts': ['History', 'Music', 'Linguistics and African Languages', 'Dramatic Arts', 'Philosophy', 'English', 'Foreign Languages', 'Religious Studies'],
  'Faculty of Computing Science and Engineering': ['Computer Engineering', 'Computer Science and Cyber Security', 'Information Systems', 'Intelligent System Engineering', 'Software Engineering'],
  'Faculty of Education': ['Adult Education and Lifelong Learning', 'Arts and Social Sciences Education', 'Counselling and Human Development', 'Educational Foundation And Counseling', 'Educational Management', 'Institute of Education', 'Physical And Health Education', 'Science And Technology Education'],
  'Faculty of Environmental Design and Management': ['Building', 'Architecture', 'Estate Management', 'Fine And Applied Arts', 'Quantity Surveying', 'Urban and Regional Planning', 'Surveying And Geoinformatics'],
  'Faculty of Law': ['Business Law', 'International Law', 'Jurisprudence and Private Law', 'Public Law'],
  'Faculty of Pharmacy': ['Pharmaceutics and Industrial Pharmacy', 'Clinical Pharmacy and Pharmacy Administration', 'Drug Research and Production Unit', 'Pharmaceutical Chemistry', 'Pharmaceutical Microbiology', 'Pharmacognosy', 'Pharmacology'],
  'Faculty of Sciences': ['Biochemistry', 'Botany', 'Chemistry', 'Geology', 'Mathematics', 'Microbiology', 'Physics', 'Statistics', 'Zoology'],
  'Faculty of Social Sciences': ['Demography and Social Statistics', 'Economics', 'Geography', 'Political Science', 'Psychology', 'Sociology and Anthropology'],
  'Faculty of Technology': ['Food Science and Technology', 'Mechanical Engineering', 'Agricultural and Environmental Engineering', 'Civil Engineering', 'Electronic and Electrical Engineering', 'Computer Science and Engineering', 'Material Science and Engineering', 'Chemical Engineering'],
}

const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate']

export default function Profile() {
  const { username } = useParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [lightbox, setLightbox] = useState(false)

  // Edit modal state
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editFaculty, setEditFaculty] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editAvatarPublic, setEditAvatarPublic] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Avatar preview/resize state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarSize, setAvatarSize] = useState(200)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const editDepartments = facultyDepartments[editFaculty] || []
  const isOwnProfile = user && profile?.id === user.id

  useEffect(() => { fetchProfile() }, [username])

  async function fetchProfile() {
    setLoading(true)
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('username', username).single()
    if (!profileData) { setLoading(false); return }
    setProfile(profileData)
    setEditUsername(profileData.username || '')
    setEditFaculty(profileData.faculty || '')
    setEditDepartment(profileData.department || '')
    setEditLevel(profileData.level || '')
    setEditAvatarPublic(profileData.avatar_public !== false)
    const { data: slidesData } = await supabase
      .from('slides').select('*').eq('uploader_id', profileData.id)
      .order('created_at', { ascending: false })
    setSlides(slidesData || [])
    if (user && user.id !== profileData.id) {
      const { data: followData } = await supabase
        .from('follows').select('*')
        .eq('follower_id', user.id).eq('following_id', profileData.id).single()
      if (followData) setIsFollowing(true)
    }
    setLoading(false)
  }

  function handleAvatarFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function getResizedBlob() {
    return new Promise(resolve => {
      const canvas = canvasRef.current
      const img = imgRef.current
      if (!canvas || !img) { resolve(null); return }
      canvas.width = avatarSize
      canvas.height = avatarSize
      const ctx = canvas.getContext('2d')
      // Draw circle crop
      ctx.clearRect(0, 0, avatarSize, avatarSize)
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarSize / 2, avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.clip()
      const scale = Math.max(avatarSize / img.naturalWidth, avatarSize / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.drawImage(img, (avatarSize - w) / 2, (avatarSize - h) / 2, w, h)
      ctx.restore()
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  async function uploadAvatar() {
    if (!avatarFile) return null
    setAvatarUploading(true)
    const blob = await getResizedBlob()
    const filePath = `avatars/${user.id}_${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('slides').upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { alert(error.message); setAvatarUploading(false); return null }
    const { data: urlData } = supabase.storage.from('slides').getPublicUrl(filePath)
    setAvatarUploading(false)
    return urlData.publicUrl + '?t=' + Date.now()
  }

  async function handleSaveEdit() {
    setEditLoading(true)
    setEditError('')

    let avatarUrl = profile.avatar_url
    if (avatarFile) {
      const uploaded = await uploadAvatar()
      if (uploaded) avatarUrl = uploaded
    }

    const { error } = await supabase.from('profiles').update({
      username: editUsername.trim(),
      faculty: editFaculty,
      department: editDepartment,
      level: editLevel,
      avatar_url: avatarUrl,
      avatar_public: editAvatarPublic,
    }).eq('id', profile.id)

    if (error) { setEditError(error.message); setEditLoading(false); return }

    await supabase.auth.updateUser({
      data: { username: editUsername.trim(), faculty: editFaculty, department: editDepartment, level: editLevel }
    })

    setProfile(p => ({ ...p, username: editUsername.trim(), faculty: editFaculty, department: editDepartment, level: editLevel, avatar_url: avatarUrl, avatar_public: editAvatarPublic }))
    setEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setEditLoading(false)
    if (editUsername.trim() !== username) navigate(`/profile/${editUsername.trim()}`, { replace: true })
  }

  function handleFollow() {
    if (!user) { navigate('/auth'); return }
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setProfile(p => ({ ...p, followers_count: wasFollowing ? (p.followers_count || 1) - 1 : (p.followers_count || 0) + 1 }))
    if (wasFollowing) {
      supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id)
      supabase.from('profiles').update({ followers_count: Math.max((profile.followers_count || 1) - 1, 0) }).eq('id', profile.id)
    } else {
      supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
      supabase.from('profiles').update({ followers_count: (profile.followers_count || 0) + 1 }).eq('id', profile.id)
    }
  }

  async function handleDelete(slide) {
    setSlides(prev => prev.filter(s => s.id !== slide.id))
    setProfile(p => ({ ...p, uploads_count: Math.max((p.uploads_count || 1) - 1, 0) }))
    setDeleteConfirm(null)
    const urlParts = slide.file_url.split('/storage/v1/object/public/slides/')
    const filePath = urlParts[1]
    if (filePath) await supabase.storage.from('slides').remove([filePath])
    await supabase.from('slides').delete().eq('id', slide.id)
    await supabase.from('profiles').update({ uploads_count: Math.max((profile.uploads_count || 1) - 1, 0) }).eq('id', profile.id)
  }

  function handleVote(slide, type) {
    if (!user) { navigate('/auth'); return }
    const newLikes = type === 'up' ? (slide.likes || 0) + 1 : Math.max((slide.likes || 1) - 1, 0)
    setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, likes: newLikes } : s))
    supabase.from('slides').update({ likes: newLikes }).eq('id', slide.id)
  }

  const inp = { width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', marginBottom: 12, fontFamily: 'inherit' }
  const sel = { width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', marginBottom: 12, cursor: 'pointer', fontFamily: 'inherit' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>Loading…</div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: theme.text }}>Profile not found</div>
        <div style={{ fontSize: 14, color: theme.muted, marginBottom: 20 }}>This account doesn't exist or hasn't been set up.</div>
        <button onClick={() => navigate('/')} style={{ fontSize: 13, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to home</button>
      </div>
    </div>
  )

  const showAvatar = profile.avatar_url && (profile.avatar_public !== false || isOwnProfile)
  const initials = profile.username?.[0]?.toUpperCase() || '?'
  const totalLikes = slides.reduce((sum, s) => sum + (s.likes || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text }}>

      {/* Navbar */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/')} style={{ fontSize: 20, fontWeight: 700, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: -0.5 }}>Slidea</button>
        <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: theme.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
      </div>

      {/* Banner */}
      <div style={{ height: 100, background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}44)`, borderBottom: `1px solid ${theme.border}` }} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 48px' }}>

        {/* Avatar + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div
            onClick={() => showAvatar && !isOwnProfile && setLightbox(true)}
            style={{ width: 72, height: 72, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, border: `3px solid ${theme.bg}`, overflow: 'hidden', cursor: showAvatar && !isOwnProfile ? 'pointer' : 'default', flexShrink: 0 }}>
            {showAvatar ? (
              <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          {!showAvatar && !isOwnProfile && profile.avatar_url && (
            <div style={{ fontSize: 11, color: theme.muted, marginLeft: 8, alignSelf: 'flex-end', marginBottom: 4 }}>🔒 Private photo</div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {isOwnProfile ? (
              <>
                <button onClick={() => setEditing(true)}
                  style={{ padding: '8px 18px', background: 'none', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  Edit profile
                </button>
                <button onClick={() => navigate('/upload')}
                  style={{ padding: '8px 18px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  + Upload
                </button>
              </>
            ) : (
              <button onClick={handleFollow}
                style={{ padding: '8px 18px', background: isFollowing ? 'none' : theme.accent, color: isFollowing ? theme.text : '#fff', border: `1px solid ${isFollowing ? theme.border : theme.accent}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.1s' }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>@{profile.username}</div>
          {profile.department && (
            <div style={{ fontSize: 14, color: theme.muted, marginBottom: 2 }}>
              {profile.department}{profile.level ? ` · ${profile.level}` : ''}
            </div>
          )}
          {profile.faculty && <div style={{ fontSize: 13, color: theme.accent }}>{profile.faculty}</div>}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Uploads', value: slides.length },
            { label: 'Likes received', value: totalLikes },
            { label: 'Followers', value: profile.followers_count || 0 },
          ].map(stat => (
            <div key={stat.label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Slides */}
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {isOwnProfile ? 'Your uploads' : `${profile.username}'s uploads`}
        </div>

        {slides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: theme.muted, fontSize: 14 }}>
            {isOwnProfile ? (
              <>No uploads yet.{' '}
                <button onClick={() => navigate('/upload')} style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Upload your first slide.</button>
              </>
            ) : 'No uploads yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slides.map(slide => (
              <div key={slide.id} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, background: theme.surface, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {slide.file_url?.includes('.pptx') || slide.file_url?.includes('.ppt') ? '📊' : slide.file_url?.includes('.docx') || slide.file_url?.includes('.doc') ? '📝' : '📄'}
                </div>
                <div onClick={() => navigate(`/slides/${slide.id}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  {slide.course_code && (
                    <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>{slide.course_code}</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slide.title}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    {slide.faculty?.replace('Faculty of ', '')}
                    {slide.department ? ` · ${slide.department}` : ''}
                    {slide.option ? ` · ${slide.option}` : ''}
                    {slide.level ? ` · ${slide.level}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleVote(slide, 'up')}
                    style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'none', cursor: 'pointer', fontSize: 13, color: theme.text }}>▲</button>
                  <span style={{ fontSize: 13, color: theme.muted, minWidth: 24, textAlign: 'center' }}>{slide.likes || 0}</span>
                  <button onClick={() => handleVote(slide, 'down')}
                    style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'none', cursor: 'pointer', fontSize: 13, color: theme.text }}>▼</button>
                </div>
                {isOwnProfile && (
                  <button onClick={() => setDeleteConfirm(slide)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ffcccc', background: '#fff5f5', color: '#c0392b', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox — view public avatar fullscreen */}
      {lightbox && showAvatar && (
        <div onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <img src={profile.avatar_url} alt="Profile"
              style={{ width: 320, height: 320, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${theme.accent}` }} />
            <div style={{ textAlign: 'center', color: '#fff', marginTop: 16, fontSize: 14 }}>@{profile.username}</div>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Tap anywhere to close</div>
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Edit profile</div>

            {/* Avatar section */}
            <div style={{ marginBottom: 20, padding: 16, background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, marginBottom: 12 }}>PROFILE PICTURE</div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Current / preview avatar */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 700, border: `2px solid ${theme.border}` }}>
                    {avatarPreview ? (
                      <img ref={imgRef} src={avatarPreview} alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="current"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : initials}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, textAlign: 'center', marginTop: 4 }}>Preview</div>
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: theme.accent, color: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                    📷 Choose photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
                  </label>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Max 5MB · JPG, PNG, WEBP</div>

                  {avatarPreview && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>
                        Resize: <strong>{avatarSize}×{avatarSize}px</strong>
                      </div>
                      <input
                        type="range" min={80} max={400} step={10}
                        value={avatarSize}
                        onChange={e => setAvatarSize(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.muted }}>
                        <span>Small</span><span>Large</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden canvas for resizing */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Privacy toggle */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>Profile picture visibility</div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    {editAvatarPublic ? 'Everyone can see and tap to view your photo' : 'Only you can see your photo'}
                  </div>
                </div>
                <button
                  onClick={() => setEditAvatarPublic(p => !p)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${editAvatarPublic ? theme.accent : theme.border}`, background: editAvatarPublic ? theme.accent : 'none', color: editAvatarPublic ? '#fff' : theme.muted, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {editAvatarPublic ? '🌍 Public' : '🔒 Private'}
                </button>
              </div>
            </div>

            {/* Other fields */}
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 5 }}>Username</div>
            <input style={inp} value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" />

            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 5 }}>Faculty</div>
            <select style={sel} value={editFaculty} onChange={e => { setEditFaculty(e.target.value); setEditDepartment('') }}>
              <option value="">Select faculty</option>
              {Object.keys(facultyDepartments).map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 5 }}>Department</div>
            <select style={{ ...sel, background: editFaculty ? theme.bg : theme.surface, cursor: editFaculty ? 'pointer' : 'not-allowed' }}
              value={editDepartment} disabled={!editFaculty} onChange={e => setEditDepartment(e.target.value)}>
              <option value="">{editFaculty ? 'Select department' : 'Select faculty first'}</option>
              {editDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 5 }}>Level</div>
            <select style={sel} value={editLevel} onChange={e => setEditLevel(e.target.value)}>
              <option value="">Select level</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {editError && (
              <div style={{ fontSize: 13, color: '#c0392b', marginBottom: 14, padding: '10px 12px', background: '#fdf0f0', borderRadius: 8 }}>{editError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => { setEditing(false); setEditError(''); setAvatarFile(null); setAvatarPreview(null) }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={editLoading || avatarUploading}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: (editLoading || avatarUploading) ? 'not-allowed' : 'pointer', opacity: (editLoading || avatarUploading) ? 0.7 : 1 }}>
                {avatarUploading ? 'Uploading photo…' : editLoading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete this slide?</div>
            <div style={{ fontSize: 14, color: theme.muted, marginBottom: 24, lineHeight: 1.6 }}>
              <strong>{deleteConfirm.title}</strong> will be permanently deleted. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#c0392b', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}