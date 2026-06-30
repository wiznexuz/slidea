import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Home from './pages/Home'
import Auth from './pages/Auth'
import SlideDetail from './pages/SlideDetail'
import Upload from './pages/Upload'
import Profile from './pages/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/slides/:id" element={<SlideDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}