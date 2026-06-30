import { createContext, useContext, useState, useEffect } from 'react'

const themes = {
  light: { bg: '#FFFFFF', surface: '#F9F9F7', text: '#1a1a1a', muted: '#888', accent: '#C9A84C', border: '#EBEBEB' },
  dark:  { bg: '#111111', surface: '#1C1C1C', text: '#F0F0F0', muted: '#888', accent: '#C9A84C', border: '#2a2a2a' },
  gold:  { bg: '#FDF6E3', surface: '#F5E6C8', text: '#2C1F00', muted: '#8a6a30', accent: '#A07830', border: '#E8D5A0' }
}

const ThemeContext = createContext(null)

function ThemeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('slidea-theme') || 'light'
  )
  const theme = themes[mode]

  function toggleTheme() {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'gold' : 'light'
    setMode(next)
    localStorage.setItem('slidea-theme', next)
  }

  useEffect(() => {
    document.body.style.background = theme.bg
    document.body.style.color = theme.text
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  return useContext(ThemeContext)
}

export { ThemeProvider, useTheme }