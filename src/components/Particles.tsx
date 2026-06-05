import { useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext'

declare global {
  interface Window {
    particlesJS: (id: string, config: object) => void
    pJSDom?: { pJS: { fn: { vendors: { destroypJS: () => void } } } }[]
  }
}

export default function Particles() {
  const { theme } = useTheme()

  useEffect(() => {
    if (!window.particlesJS) return

    // destroy previous instance if any
    if (window.pJSDom && window.pJSDom.length > 0) {
      window.pJSDom.forEach(p => {
        try { p.pJS.fn.vendors.destroypJS() } catch {}
      })
      window.pJSDom = []
    }

    const color = theme === 'dark' ? '#1A7D6F' : '#1A7D6F'
    const opacity = theme === 'dark' ? 0.45 : 0.25

    window.particlesJS('particles-js', {
      particles: {
        number: { value: 55, density: { enable: true, value_area: 900 } },
        color: { value: [color, '#22a090', '#155f55'] },
        shape: { type: 'circle' },
        opacity: { value: opacity, random: true },
        size: { value: 2.5, random: true },
        line_linked: {
          enable: true,
          distance: 140,
          color: color,
          opacity: theme === 'dark' ? 0.15 : 0.10,
          width: 1,
        },
        move: { enable: true, speed: 0.7, random: true, out_mode: 'out' },
      },
      interactivity: {
        detect_on: 'window',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
        },
        modes: {
          grab: { distance: 160, line_linked: { opacity: 0.4 } },
          push: { particles_nb: 2 },
        },
      },
      retina_detect: true,
    })
  }, [theme])

  return <div id="particles-js" />
}
