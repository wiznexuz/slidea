import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

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

function toSentenceCase(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function loadSavedOptions() {
  try {
    const saved = localStorage.getItem('slidea-dept-options')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

function saveSavedOptions(data) {
  localStorage.setItem('slidea-dept-options', JSON.stringify(data))
}

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [faculty, setFaculty] = useState('')
  const [department, setDepartment] = useState('')
  const [option, setOption] = useState('')
  const [customOptionInput, setCustomOptionInput] = useState('')
  const [showCustomOption, setShowCustomOption] = useState(false)
  const [level, setLevel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedOptions, setSavedOptions] = useState(loadSavedOptions)
  const navigate = useNavigate()
  const { theme } = useTheme()

  const departments = facultyDepartments[faculty] || []
  const deptKey = `signup__${faculty}__${department}`
  const existingOptions = savedOptions[deptKey] || []

  function handleFacultyChange(val) {
    setFaculty(val)
    setDepartment('')
    setOption('')
    setCustomOptionInput('')
    setShowCustomOption(false)
  }

  function handleDepartmentChange(val) {
    setDepartment(val)
    setOption('')
    setCustomOptionInput('')
    setShowCustomOption(false)
  }

  function handleOptionSelect(val) {
    if (val === '__add__') {
      setShowCustomOption(true)
      setOption('')
    } else {
      setOption(val)
      setShowCustomOption(false)
    }
  }

  function handleAddCustomOption() {
    const val = customOptionInput.trim()
    if (!val) return
    const already = existingOptions.map(o => o.toLowerCase()).includes(val.toLowerCase())
    if (!already) {
      const updated = { ...savedOptions, [deptKey]: [...existingOptions, val] }
      setSavedOptions(updated)
      saveSavedOptions(updated)
    }
    setOption(val)
    setCustomOptionInput('')
    setShowCustomOption(false)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/', { replace: true })
    } else {
      if (!username.trim()) { setError('Please enter a username'); setLoading(false); return }
      if (!email.trim()) { setError('Please enter your email'); setLoading(false); return }
      if (!password.trim()) { setError('Please enter a password'); setLoading(false); return }
      if (!faculty) { setError('Please select your faculty'); setLoading(false); return }
      if (!department) { setError('Please select your department'); setLoading(false); return }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, faculty, department, option, level }
        }
      })
      if (error) setError(error.message)
      else navigate('/', { replace: true })
    }
    setLoading(false)
  }

  const inp = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    fontSize: 15,
    background: theme.bg,
    color: theme.text,
    outline: 'none',
    marginBottom: 12,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const sel = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    fontSize: 15,
    background: theme.bg,
    color: theme.text,
    outline: 'none',
    marginBottom: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 440, paddingTop: 24 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.accent, letterSpacing: -0.5, marginBottom: 4 }}>Slidea</div>
          <div style={{ fontSize: 14, color: theme.muted }}>
            {tab === 'login' ? 'Welcome back' : 'Join thousands of students'}
          </div>
        </div>

        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 20, padding: '28px 24px', background: theme.bg, boxSizing: 'border-box' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, marginBottom: 24 }}>
            {['login', 'signup'].map(t => (
              <button key={t}
                onClick={() => { setTab(t); setError('') }}
                style={{ flex: 1, padding: '10px 0', fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? theme.accent : theme.muted, borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent', fontWeight: tab === t ? 600 : 400, marginBottom: -1 }}>
                {t === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Login fields */}
          {tab === 'login' && (
            <>
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Email address</div>
              <input
                style={inp}
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Password</div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input
                  style={{ ...inp, marginBottom: 0, paddingRight: 48 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: theme.muted, padding: 4, lineHeight: 1 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </>
          )}

          {/* Signup fields */}
          {tab === 'signup' && (
            <>
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Username</div>
              <input
                style={inp}
                placeholder="e.g. chimdi_eze"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Email address</div>
              <input
                style={inp}
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Password</div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input
                  style={{ ...inp, marginBottom: 0, paddingRight: 48 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: theme.muted, padding: 4, lineHeight: 1 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <div style={{ height: 1, background: theme.border, margin: '8px 0 16px' }} />
              <div style={{ fontSize: 13, color: theme.accent, fontWeight: 600, marginBottom: 12 }}>
                Your academic details
              </div>

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Faculty</div>
              <select style={sel} value={faculty} onChange={e => handleFacultyChange(e.target.value)}>
                <option value="">Select your faculty</option>
                {Object.keys(facultyDepartments).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>
                Department{' '}
                {!faculty && <span style={{ color: theme.border, fontSize: 12 }}>— select faculty first</span>}
              </div>
              <select
                style={{ ...sel, background: faculty ? theme.bg : theme.surface, cursor: faculty ? 'pointer' : 'not-allowed' }}
                value={department}
                disabled={!faculty}
                onChange={e => handleDepartmentChange(e.target.value)}>
                <option value="">{faculty ? 'Select your department' : 'Select faculty first'}</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {department && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>
                    Option{' '}
                    <span style={{ color: theme.border, fontStyle: 'italic', fontSize: 12 }}>(if applicable)</span>
                  </div>

                  {existingOptions.length > 0 && !showCustomOption ? (
                    <select style={sel} value={option} onChange={e => handleOptionSelect(e.target.value)}>
                      <option value="">No option / Not applicable</option>
                      {existingOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      <option value="__add__">+ Add an option not listed</option>
                    </select>
                  ) : !showCustomOption ? (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        style={{ ...inp, marginBottom: 0, flex: 1 }}
                        placeholder="e.g. Computer Science with Mathematics"
                        value={customOptionInput}
                        onChange={e => setCustomOptionInput(toSentenceCase(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomOption()}
                      />
                      <button onClick={handleAddCustomOption}
                        style={{ padding: '11px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Add
                      </button>
                      <button onClick={() => { setOption(''); setCustomOptionInput('') }}
                        style={{ padding: '11px 14px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', color: theme.muted, whiteSpace: 'nowrap' }}>
                        Skip
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        style={{ ...inp, marginBottom: 0, flex: 1 }}
                        placeholder="e.g. Computer Science with Mathematics"
                        value={customOptionInput}
                        onChange={e => setCustomOptionInput(toSentenceCase(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomOption()}
                        autoFocus
                      />
                      <button onClick={handleAddCustomOption}
                        style={{ padding: '11px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Add
                      </button>
                      <button onClick={() => { setShowCustomOption(false); setCustomOptionInput('') }}
                        style={{ padding: '11px 14px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', color: theme.muted, whiteSpace: 'nowrap' }}>
                        Cancel
                      </button>
                    </div>
                  )}

                  {option && !showCustomOption && (
                    <div style={{ fontSize: 12, color: theme.accent, marginTop: -6, marginBottom: 8 }}>
                      ✓ Option: <strong>{option}</strong>
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 5 }}>Level</div>
              <select style={sel} value={level} onChange={e => setLevel(e.target.value)}>
                <option value="">Select your level</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </>
          )}

          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', marginBottom: 14, padding: '10px 12px', background: '#fdf0f0', borderRadius: 8, lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? theme.muted : theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxSizing: 'border-box', marginTop: 4 }}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: theme.muted }}>
            {tab === 'login' ? (
              <>No account?{' '}
                <button onClick={() => { setTab('signup'); setError('') }}
                  style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setTab('login'); setError('') }}
                  style={{ color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                  Log in
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 32 }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 14, color: theme.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to Slidea
          </button>
        </div>
      </div>
    </div>
  )
}