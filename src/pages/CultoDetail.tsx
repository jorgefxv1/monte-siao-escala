import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Culto, EscalaItem, Ministerio, MINISTERIO_LABELS, CULTO_TIPO_LABELS, CULTO_TIPO_HORARIOS, funcaoColor, nameToColor } from '../lib/types'
import MinisterioIcon from '../components/MinisterioIcon'
import { Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../lib/ThemeContext'

export default function CultoDetail() {
  const { id } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [culto, setCulto] = useState<Culto | null>(null)
  const [escala, setEscala] = useState<EscalaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchData(id) }, [id])

  async function fetchData(cultoId: string) {
    setLoading(true)
    const [{ data: cultoData }, { data: escalaData }] = await Promise.all([
      supabase.from('cultos').select('*').eq('id', cultoId).single(),
      supabase.from('escalas').select('*, membro:membros(*)').eq('culto_id', cultoId).order('ordem').order('created_at'),
    ])
    setCulto(cultoData)
    setEscala(escalaData || [])
    setLoading(false)
  }

  const porMinisterio = escala.reduce<Record<string, EscalaItem[]>>((acc, item) => {
    if (!acc[item.ministerio]) acc[item.ministerio] = []
    acc[item.ministerio].push(item)
    return acc
  }, {})

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ width: 22, height: 22, borderRadius: 4 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ width: 140, height: 14 }} />
          <div className="skeleton" style={{ width: 100, height: 11 }} />
        </div>
      </div>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 90, height: 14 }} />
            </div>
            {[1, 2].map(j => (
              <div key={j} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ width: 60, height: 10 }} />
                  <div className="skeleton" style={{ width: 110, height: 13 }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  if (!culto) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Culto não encontrado.
    </div>
  )

  const data = parseISO(culto.data)
  const dataFormatada = format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const isHoje = culto.data === new Date().toISOString().split('T')[0]

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: theme === 'dark' ? 'rgba(15,26,25,0.85)' : 'rgba(244,249,248,0.90)',
        backdropFilter: 'blur(16px)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 22, lineHeight: 1,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.2s', padding: 0,
          }}>‹</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {culto.titulo || CULTO_TIPO_LABELS[culto.tipo]}
              {isHoje && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(26,125,111,0.2)', color: 'var(--teal-light)', border: '1px solid rgba(26,125,111,0.35)', padding: '1px 8px', borderRadius: 99 }}>hoje</span>}
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{dataFormatada}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {CULTO_TIPO_HORARIOS[culto.tipo]}
              </span>
            </div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
        {Object.keys(porMinisterio).length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', padding: 48,
            border: '1px dashed var(--border)', borderRadius: 14,
            background: 'var(--bg-card)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            Escala ainda não preenchida.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(Object.entries(porMinisterio) as [Ministerio, EscalaItem[]][]).map(([min, items], i) => (
              <div
                key={min}
                className={`card-hover fade-in fade-in-delay-${Math.min(i + 1, 5)}`}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-card2)',
                }}>
                  <MinisterioIcon ministerio={min} size={17} color="var(--teal-light)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>
                    {MINISTERIO_LABELS[min]}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11,
                    background: 'rgba(26,125,111,0.15)', color: 'var(--teal-light)',
                    padding: '2px 10px', borderRadius: 99, fontWeight: 600,
                    border: '1px solid rgba(26,125,111,0.25)',
                  }}>{items.length} {items.length === 1 ? 'membro' : 'membros'}</span>
                </div>

                <div>
                  {items.map((item, j) => (
                    <div key={item.id}
                      className="member-row"
                      style={{
                        padding: '12px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: j < items.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.15s',
                        animationDelay: `${j * 0.07}s`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: nameToColor(item.membro?.nome || ''),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontWeight: 700, fontSize: 15, color: '#fff',
                      }}>
                        {(item.membro?.nome || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {item.funcao && (
                          <div style={{ fontSize: 10, color: funcaoColor(item.funcao), fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                            {item.funcao}
                          </div>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
                          {item.membro?.nome || 'Membro'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
