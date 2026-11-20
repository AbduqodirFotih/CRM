import { create } from 'zustand'

const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('theme') === 'dark',
  toggleTheme: () => set((state) => {
    const newMode = !state.darkMode
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    return { darkMode: newMode }
  })
}))

export default useThemeStore
