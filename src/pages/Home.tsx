import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Ministerio, MINISTERIO_LABELS, CULTO_TIPO_LABELS, CULTO_TIPO_HORARIOS, Culto, EscalaItem } from '../lib/types'
import MinisterioIcon from '../components/MinisterioIcon'
import { useTheme } from '../lib/ThemeContext'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Calendar } from 'lucide-react'
import logoEscuro from '../assets/logo-escuro.png'
import logoBranco from '../assets/logo-branco.png'

const MINISTERIOS: Ministerio[] = [
  'pregacao', 'louvor', 'recepcao', 'midia', 'live', 'danca', 'intercessao', 'obreiros'
]

const MINISTERIO_DESC: Record<Ministerio, string> = {
  pregacao:   'Quem prega e dirige no altar',
  louvor:     'Músicos e vocalistas',
  recepcao:   'Boas-vindas e acolhimento',
  midia:      'Som, telão e transmissão',
  live:       'Operação da live',
  danca:      'Ministério de dança',
  intercessao:'Intercessores',
  obreiros:   'Suporte e estrutura',
}

interface ProximoCulto {
  culto: Culto
  pregadores: EscalaItem[]
  totalEscalados: number
}

function MinCard({ min, count, index }: { min: Ministerio; count: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el) } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hasData = count > 0

  return (
    <Link to={`/ministerio/${min}`}>
      <div
        ref={ref}
        className="scroll-reveal min-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '22px 16px 18px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 12,
          cursor: 'pointer', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          height: '100%',
          transitionDelay: `${index * 0.06}s`,
        }}
      >
        {hasData && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(26,125,111,0.13) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        <div
          className="min-icon"
          style={{
            width: 54, height: 54, borderRadius: 15,
            background: hasData
              ? 'linear-gradient(135deg, #22a090 0%, #1A7D6F 55%, #155f55 100%)'
              : 'var(--bg-card2)',
            border: `1px solid ${hasData ? 'rgba(26,125,111,0.4)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hasData ? '0 4px 16px rgba(26,125,111,0.3)' : 'none',
          }}
        >
          <MinisterioIcon ministerio={min} size={22} color={hasData ? '#fff' : 'var(--text-muted)'} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--white)', lineHeight: 1.3 }}>
            {MINISTERIO_LABELS[min]}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {MINISTERIO_DESC[min]}
          </div>
        </div>

        {hasData && <span className="teal-badge">{count} escalados</span>}
        {!hasData && <span style={{ fontSize: 11, color: 'var(--border)', fontWeight: 500 }}>sem escala</span>}
      </div>
    </Link>
  )
}

export default function Home() {
  const { theme, toggle } = useTheme()
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [proximo, setProximo] = useState<ProximoCulto | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchContagens()
    fetchProximo()
  }, [])

  useEffect(() => {
    const handler = () => {
      if (headerRef.current) {
        headerRef.current.style.borderBottomColor = window.scrollY > 10
          ? 'var(--border)' : 'transparent'
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  async function fetchContagens() {
    const d = new Date()
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
    const fim    = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('escalas')
      .select('ministerio, culto:cultos!inner(data)')
      .gte('culto.data', inicio)
      .lte('culto.data', fim)
    const cnt: Record<string, number> = {}
    ;(data || []).forEach((row: { ministerio: string }) => {
      cnt[row.ministerio] = (cnt[row.ministerio] || 0) + 1
    })
    setContagens(cnt)
  }

  async function fetchProximo() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data: cultoData } = await supabase
      .from('cultos')
      .select('*')
      .gte('data', hoje)
      .order('data')
      .limit(1)
      .single()

    if (!cultoData) return

    const { data: escalaData } = await supabase
      .from('escalas')
      .select('*, membro:membros(*)')
      .eq('culto_id', cultoData.id)

    const escalas = escalaData || []
    const pregadores = escalas.filter(e => e.ministerio === 'pregacao')

    setProximo({
      culto: cultoData,
      pregadores,
      totalEscalados: escalas.length,
    })
  }

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <header
        ref={headerRef}
        style={{
          borderBottom: '1px solid transparent',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0,
          background: theme === 'dark' ? 'rgba(15,26,25,0.80)' : 'rgba(242,248,247,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10,
          transition: 'border-color 0.3s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo — mostra só o ícone da montanha via crop */}
          <div style={{
            width: 66, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
          }}>
            <img
              src={theme === 'dark' ? logoEscuro : logoBranco}
              alt="Monte Sião"
              style={{ height: '100%', width: 'auto', maxWidth: 'none', display: 'block' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--white)', letterSpacing: '-0.3px' }}>
              Monte Sião
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="pulse-dot" />
              Escalas de serviço
            </div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px 60px', position: 'relative', zIndex: 1 }}>

        {/* Card — Próximo culto */}
        {proximo && (() => {
          const data = parseISO(proximo.culto.data)
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          const diff = differenceInCalendarDays(data, hoje)
          const diffLabel = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `em ${diff} dias`

          return (
            <Link to={`/culto/${proximo.culto.id}`}>
              <div className="card-hover" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                overflow: 'hidden',
                marginBottom: 32,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse at 0% 0%, rgba(26,125,111,0.18) 0%, transparent 65%)',
                  pointerEvents: 'none',
                }} />

                <div style={{ padding: '18px 20px 14px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 2,
                      textTransform: 'uppercase', color: 'var(--teal-light)',
                    }}>Próximo culto</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: diff === 0 ? 'rgba(26,125,111,0.2)' : 'var(--bg-card2)',
                      color: diff === 0 ? 'var(--teal-light)' : 'var(--text-muted)',
                      border: `1px solid ${diff === 0 ? 'rgba(26,125,111,0.35)' : 'var(--border)'}`,
                      padding: '2px 10px', borderRadius: 99,
                    }}>{diffLabel}</span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--white)', letterSpacing: '-0.4px', marginBottom: 3 }}>
                    {proximo.culto.titulo || CULTO_TIPO_LABELS[proximo.culto.tipo]}
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>{format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} />
                      {CULTO_TIPO_HORARIOS[proximo.culto.tipo]}
                    </span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '12px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-card2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {proximo.pregadores.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <MinisterioIcon ministerio="pregacao" size={13} color="var(--teal-light)" />
                        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                          {proximo.pregadores.map(p => p.membro?.nome).filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {proximo.totalEscalados > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {proximo.totalEscalados} escalados
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color="var(--teal)" />
                </div>
              </div>
            </Link>
          )
        })()}

        {/* Hero label */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 2.5,
            textTransform: 'uppercase', color: 'var(--teal-light)',
          }}>
            Escolha o ministério
          </span>
        </div>
        <h1 style={{
          textAlign: 'center', fontSize: 26, fontWeight: 800,
          color: 'var(--white)', letterSpacing: '-0.7px', marginBottom: 32,
          lineHeight: 1.2,
        }}>
          Escalas do mês
        </h1>

        {/* Grid de ministérios */}
        <div className="ministerios-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {MINISTERIOS.map((min, i) => (
            <MinCard key={min} min={min} count={contagens[min] || 0} index={i} />
          ))}
        </div>

        {/* CTA ver todos os cultos */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/cultos">
            <button
              className="glow-border"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                padding: '11px 28px', borderRadius: 12,
                fontSize: 13, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <Calendar size={14} />
              Ver todos os cultos do mês
            </button>
          </Link>
        </div>

        {/* Slogan */}
        <p style={{
          textAlign: 'center', marginTop: 48,
          fontSize: 12, color: 'var(--border)',
          letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600,
        }}>
          Uma casa para a cidade
        </p>
      </main>
    </div>
  )
}
