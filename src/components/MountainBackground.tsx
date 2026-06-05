import { useEffect, useRef } from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function MountainBackground() {
  const { theme } = useTheme()
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const scrollY = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0
      // parallax: sobe até 60px conforme scroll desce
      const translateY = progress * 60
      ref.current.style.transform = `translateX(-50%) translateY(${translateY}px)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const opacity = theme === 'dark' ? 0.045 : 0.055

  return (
    <svg
      ref={ref}
      viewBox="0 0 500 380"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'fixed',
        bottom: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(90vw, 700px)',
        height: 'auto',
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 0.4s',
        // Gradiente de baixo para cima: mais visível na base, some no topo
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
      }}
      aria-hidden="true"
    >
      {/* Montanha direita (atrás) */}
      <path
        d="M260,380 L390,110 L500,380 Z"
        fill="var(--teal)"
        opacity="0.7"
      />
      {/* Montanha principal (esquerda/frente) */}
      <path
        d="M0,380 L160,40 L310,380 Z"
        fill="var(--teal)"
      />
      {/* Entalhe branco (diamante) — detalhe da logo */}
      <path
        d="M100,280 L160,100 L210,260 Z"
        fill="var(--bg)"
        opacity="0.85"
      />
    </svg>
  )
}
