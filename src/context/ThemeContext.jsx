import { createContext, useContext, useState, useEffect } from 'react'

const themes = {
  light: {
    bg: '#FFFFFF',
    surface: '#F7F7F5',
    text: '#111111',
    muted: '#555555',
    accent: '#C9A84C',
    border: '#E0E0E0'
  },
  dark: {
    bg: '#111111',
    surface: '#1C1C1C',
    text: '#F0F0F0',
    muted: '#999999',
    accent: '#C9A84C',
    border: '#2a2a2a'
  },
  gold: {
    bg: '#FDF6E3',
    surface: '#F0E4C4',
    text: '#1a1200',
    muted: '#6b4f1a',
    accent: '#8a5e0a',
    border: '#D4B87A'
  }
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