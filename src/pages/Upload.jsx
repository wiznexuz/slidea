import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function fileIcon(file) {
  if (!file) return '📁'
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return '📄'
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return '📊'
  if (name.endsWith('.docx') || name.endsWith('.doc')) return '📝'
  return '📁'
}

export default function Upload() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [description, setDescription] = useState('')
  const [faculty, setFaculty] = useState('')
  const [department, setDepartment] = useState('')
  const [option, setOption] = useState('')
  const [customOptionInput, setCustomOptionInput] = useState('')
  const [showCustomOption, setShowCustomOption] = useState(false)
  const [level, setLevel] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedOptions, setSavedOptions] = useState(loadSavedOptions)

  const departments = facultyDepartments[faculty] || []
  const deptKey = `upload__${faculty}__${department}`
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

  const inp = {
    width: '100%', padding: '10px 14px',
    border: `1px solid ${theme.border}`, borderRadius: 10,
    fontSize: 14, background: theme.bg, color: theme.text,
    outline: 'none', marginBottom: 16, fontFamily: 'inherit',
  }

  const sel = {
    width: '100%', padding: '10px 14px',
    border: `1px solid ${theme.border}`, borderRadius: 10,
    fontSize: 14, background: theme.bg, color: theme.text,
    outline: 'none', marginBottom: 16, cursor: 'pointer', fontFamily: 'inherit',
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: theme.muted, marginBottom: 16 }}>You need to be logged in to upload slides</div>
          <button onClick={() => navigate('/auth')}
            style={{ padding: '10px 24px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
            Log in
          </button>
        </div>
      </div>
    )
  }

  async function handleUpload() {
    if (!title.trim() || !file || !faculty || !department) {
      setError('Please fill in the title, faculty, department and choose a file.')
      return
    }
    setLoading(true)
    setError('')

    const filePath = `${user.id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('slides')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('slides').getPublicUrl(filePath)

    const { error: dbError } = await supabase.from('slides').insert({
      title,
      course_code: courseCode,
      description,
      faculty,
      department,
      option: option || null,
      level,
      file_url: urlData.publicUrl,
      uploader_id: user.id,
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    navigate('/')
  }

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

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Upload a slide</div>
        <div style={{ fontSize: 14, color: theme.muted, marginBottom: 32 }}>Share your lecture notes with other students</div>

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>Course title / Slide title *</div>
        <input style={inp} placeholder="e.g. Introduction to Biochemistry"
          value={title} onChange={e => setTitle(e.target.value)} />

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>Course code</div>
        <input style={inp} placeholder="e.g. BCH 201, CSC 301"
          value={courseCode} onChange={e => setCourseCode(e.target.value)} />

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>Description</div>
        <textarea
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, background: theme.bg, color: theme.text, outline: 'none', marginBottom: 16, height: 90, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="What topics does this slide cover?"
          value={description} onChange={e => setDescription(e.target.value)}
        />

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>Faculty *</div>
        <select style={sel} value={faculty} onChange={e => handleFacultyChange(e.target.value)}>
          <option value="">Select faculty</option>
          {Object.keys(facultyDepartments).map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>
          Department *{' '}
          {!faculty && <span style={{ color: theme.border }}>— select a faculty first</span>}
        </div>
        <select
          style={{ ...sel, background: faculty ? theme.bg : theme.surface, cursor: faculty ? 'pointer' : 'not-allowed' }}
          value={department} disabled={!faculty}
          onChange={e => handleDepartmentChange(e.target.value)}>
          <option value="">{faculty ? 'Select department' : 'Select a faculty first'}</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {department && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>
              Option{' '}
              <span style={{ color: theme.border, fontStyle: 'italic' }}>
                (if applicable — e.g. "Computer Science with Mathematics")
              </span>
            </div>
            {existingOptions.length > 0 && !showCustomOption ? (
              <select style={sel} value={option} onChange={e => handleOptionSelect(e.target.value)}>
                <option value="">No option / Not applicable</option>
                {existingOptions.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="__add__">+ Add an option not listed</option>
              </select>
            ) : !showCustomOption ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, marginBottom: 0, flex: 1 }}
                  placeholder="e.g. Computer Science with Mathematics"
                  value={customOptionInput}
                  onChange={e => setCustomOptionInput(toSentenceCase(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomOption()}
                />
                <button onClick={handleAddCustomOption}
                  style={{ padding: '10px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Add
                </button>
                <button onClick={() => { setOption(''); setCustomOptionInput('') }}
                  style={{ padding: '10px 14px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', color: theme.muted, whiteSpace: 'nowrap' }}>
                  Skip
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, marginBottom: 0, flex: 1 }}
                  placeholder="e.g. Computer Science with Mathematics"
                  value={customOptionInput}
                  onChange={e => setCustomOptionInput(toSentenceCase(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomOption()}
                  autoFocus
                />
                <button onClick={handleAddCustomOption}
                  style={{ padding: '10px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Add
                </button>
                <button onClick={() => { setShowCustomOption(false); setCustomOptionInput('') }}
                  style={{ padding: '10px 14px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', color: theme.muted, whiteSpace: 'nowrap' }}>
                  Cancel
                </button>
              </div>
            )}
            {option && !showCustomOption && (
              <div style={{ fontSize: 12, color: theme.accent, marginTop: 8 }}>
                ✓ Option: <strong>{option}</strong>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>Level</div>
        <select style={sel} value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">Select level</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>File *</div>
        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 10 }}>
          Accepted formats: <strong>PDF</strong>, <strong>DOCX</strong>, <strong>PPTX</strong>
        </div>
        <div
          style={{ border: `2px dashed ${file ? theme.accent : theme.border}`, borderRadius: 12, padding: '28px', textAlign: 'center', marginBottom: 20, cursor: 'pointer', background: theme.surface }}
          onClick={() => document.getElementById('fileInput').click()}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{fileIcon(file)}</div>
          <div style={{ fontSize: 14, color: file ? theme.accent : theme.muted, fontWeight: file ? 500 : 400 }}>
            {file ? file.name : 'Click to choose a file'}
          </div>
          {file && (
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#c0392b', marginBottom: 16, padding: '10px 14px', background: '#fdf0f0', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button onClick={handleUpload} disabled={loading}
          style={{ width: '100%', padding: '13px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Uploading…' : 'Upload slide'}
        </button>
      </div>
    </div>
  )
}