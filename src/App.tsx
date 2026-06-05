import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import Home from './pages/Home'
import CultosPage from './pages/CultosPage'
import MinisterioPage from './pages/MinisterioPage'
import CultoDetail from './pages/CultoDetail'
import Admin from './pages/Admin'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cultos" element={<CultosPage />} />
        <Route path="/ministerio/:slug" element={<MinisterioPage />} />
        <Route path="/culto/:id" element={<CultoDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </ThemeProvider>
  )
}
