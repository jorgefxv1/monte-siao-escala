import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Ministerio, MINISTERIO_LABELS, CULTO_TIPO_LABELS, CULTO_TIPO_HORARIOS, EscalaItem, Culto, funcaoColor, TIPO_CORES, nameToColor } from '../lib/types'
import MinisterioIcon from '../components/MinisterioIcon'
import { Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../lib/ThemeContext'
import logoEscuro from '../assets/logo-escuro.png'
import logoBranco from '../assets/logo-branco.png'

interface CultoComEscala extends Culto { escalas: EscalaItem[] }

function RevealCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el) } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} className="scroll-reveal card-hover" style={style}>{children}</div>
}

export default function MinisterioPage() {
  const { slug } = useParams<{ slug: string }>()
  const { theme, toggle } = useTheme()
  const ministerio = slug as Ministerio
  const [cultos, setCultos] = useState<CultoComEscala[]>([])
  const [loading, setLoading] = useState(true)
  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date()
    return { mes: d.getMonth(), ano: d.getFullYear() }
  })

  useEffect(() => { fetchData() }, [mesAtual, ministerio])

  async function fetchData() {
    setLoading(true)
    const inicio = new Date(mesAtual.ano, mesAtual.mes, 1).toISOString().split('T')[0]
    const fim    = new Date(mesAtual.ano, mesAtual.mes + 1, 0).toISOString().split('T')[0]
    const { data: cultosData } = await supabase
      .from('cultos').select('*').gte('data', inicio).lte('data', fim).order('data')
    if (!cultosData) { setLoading(false); return }
    const { data: escalasData } = await supabase
      .from('escalas').select('*, membro:membros(*)')
      .in('culto_id', cultosData.map(c => c.id))
      .eq('ministerio', ministerio)
      .order('ordem')
      .order('created_at')
    const map: Record<string, EscalaItem[]> = {}
    ;(escalasData || []).forEach(e => { if (!map[e.culto_id]) map[e.culto_id] = []; map[e.culto_id].push(e) })
    setCultos(cultosData.filter(c => map[c.id]?.length > 0).map(c => ({ ...c, escalas: map[c.id] })))
    setLoading(false)
  }

  function mudarMes(delta: number) {
    setMesAtual(prev => {
      let mes = prev.mes + delta, ano = prev.ano
      if (mes > 11) { mes = 0; ano++ } if (mes < 0) { mes = 11; ano-- }
      return { mes, ano }
    })
  }

  const nomeMes = new Date(mesAtual.ano, mesAtual.mes, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: theme === 'dark' ? 'rgba(15,26,25,0.80)' : 'rgba(242,248,247,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, marginRight: 2 }}>‹</Link>
          <Link to="/" style={{ width: 66, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
            <img
              src={theme === 'dark' ? logoEscuro : logoBranco}
              alt="Monte Sião"
              style={{ height: '100%', width: 'auto', maxWidth: 'none', display: 'block' }}
            />
          </Link>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--white)' }}>{MINISTERIO_LABELS[ministerio]}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Escala do ministério</div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 60px', position: 'relative', zIndex: 1 }}>
        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => mudarMes(-1)} style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            color: 'var(--text)', width: 40, height: 40, borderRadius: 10, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >‹</button>

          <span style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 18, color: 'var(--white)', textTransform: 'capitalize' }}>
            {nomeMes}
          </span>

          <button onClick={() => mudarMes(1)} style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            color: 'var(--text)', width: 40, height: 40, borderRadius: 10, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >›</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card2)' }}>
                  <div className="skeleton" style={{ minWidth: 46, height: 46, borderRadius: 8 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div className="skeleton" style={{ height: 13, width: '55%' }} />
                    <div className="skeleton" style={{ height: 11, width: '35%' }} />
                  </div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {[1,2].map(j => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderTop: j > 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="skeleton" style={{ height: 12, width: '45%' }} />
                        <div className="skeleton" style={{ height: 10, width: '30%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : cultos.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', padding: 48,
            border: '1px dashed var(--border)', borderRadius: 14, background: 'var(--bg-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MinisterioIcon ministerio={ministerio} size={32} color="var(--text-muted)" />
            </div>
            Nenhuma escala para este ministério neste mês.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cultos.map(culto => {
              const data   = parseISO(culto.data)
              const accent = TIPO_CORES[culto.tipo] || 'var(--teal)'
              const hoje   = new Date().toISOString().split('T')[0]
              const isHoje = culto.data === hoje
              return (
                <RevealCard key={culto.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderLeft: `3px solid ${accent}`, borderRadius: 14, overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
                      borderBottom: '1px solid var(--border)', background: 'var(--bg-card2)',
                    }}>
                      <div style={{
                        minWidth: 46, textAlign: 'center',
                        background: 'var(--bg)', borderRadius: 8, padding: '6px 0',
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: accent, lineHeight: 1 }}>
                          {format(data, 'dd')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {format(data, 'MMM', { locale: ptBR })}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {culto.titulo || CULTO_TIPO_LABELS[culto.tipo]}
                          {isHoje && <span style={{ fontSize: 10, fontWeight: 700, background: `${accent}22`, color: accent, border: `1px solid ${accent}55`, padding: '1px 8px', borderRadius: 99 }}>hoje</span>}
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span>{format(data, 'EEEE', { locale: ptBR })}</span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            {CULTO_TIPO_HORARIOS[culto.tipo]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '4px 0' }}>
                      {culto.escalas.map((item, j) => (
                        <div key={item.id}
                          className="member-row"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '9px 18px',
                            borderTop: j > 0 ? '1px solid var(--border)' : 'none',
                            animationDelay: `${j * 0.07}s`,
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: nameToColor(item.membro?.nome || ''),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontWeight: 700, fontSize: 13, color: '#fff',
                          }}>
                            {(item.membro?.nome || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {item.funcao && (
                              <div style={{ fontSize: 10, color: funcaoColor(item.funcao), fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 1 }}>
                                {item.funcao}
                              </div>
                            )}
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
                              {item.membro?.nome}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RevealCard>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
