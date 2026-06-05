import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Culto, CULTO_TIPO_LABELS, CULTO_TIPO_HORARIOS } from '../lib/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../lib/ThemeContext'
import { Clock } from 'lucide-react'
import logoEscuro from '../assets/logo-escuro.png'
import logoBranco from '../assets/logo-branco.png'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const TIPO_CORES: Record<string, string> = {
  'domingo-noite': '#10b981',  // emerald
  'domingo-manha': '#F59E0B',  // amber
  'terca':         '#818CF8',  // indigo
  'sabado-zion':   '#F472B6',  // pink
}

export default function CultosPage() {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [cultos, setCultos] = useState<Culto[]>([])
  const [loading, setLoading] = useState(true)
  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date()
    return { mes: d.getMonth(), ano: d.getFullYear() }
  })

  useEffect(() => { fetchCultos() }, [mesAtual])

  async function fetchCultos() {
    setLoading(true)
    const inicio = new Date(mesAtual.ano, mesAtual.mes, 1).toISOString().split('T')[0]
    const fim    = new Date(mesAtual.ano, mesAtual.mes + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('cultos').select('*')
      .gte('data', inicio).lte('data', fim)
      .order('data', { ascending: true })
    setCultos(data || [])
    setLoading(false)
  }

  function mudarMes(delta: number) {
    setMesAtual(prev => {
      let mes = prev.mes + delta
      let ano = prev.ano
      if (mes > 11) { mes = 0; ano++ }
      if (mes < 0)  { mes = 11; ano-- }
      return { mes, ano }
    })
  }

  const cultoPorDia: Record<number, Culto[]> = {}
  cultos.forEach(c => {
    const dia = parseISO(c.data).getDate()
    if (!cultoPorDia[dia]) cultoPorDia[dia] = []
    cultoPorDia[dia].push(c)
  })

  const primeiroDia  = new Date(mesAtual.ano, mesAtual.mes, 1)
  const ultimoDia    = new Date(mesAtual.ano, mesAtual.mes + 1, 0)
  const offsetInicio = primeiroDia.getDay()
  const totalCelulas = Math.ceil((offsetInicio + ultimoDia.getDate()) / 7) * 7

  const hoje       = new Date()
  const ehMesAtual = hoje.getMonth() === mesAtual.mes && hoje.getFullYear() === mesAtual.ano

  function handleDiaClick(dia: number) {
    const cs = cultoPorDia[dia]
    if (!cs || cs.length === 0) return
    if (cs.length === 1) navigate(`/culto/${cs[0].id}`)
  }

  const nomeMes = new Date(mesAtual.ano, mesAtual.mes, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      <header style={{
        borderBottom: '1px solid var(--border)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: theme === 'dark' ? 'rgba(15,26,25,0.85)' : 'rgba(244,249,248,0.90)',
        backdropFilter: 'blur(16px)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, marginRight: 2 }}>‹</Link>
          <div style={{ width: 66, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={theme === 'dark' ? logoEscuro : logoBranco}
              alt="Monte Sião"
              style={{ height: '100%', width: 'auto', maxWidth: 'none', display: 'block' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--white)' }}>Monte Sião</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{nomeMes}</div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => mudarMes(-1)} style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            color: 'var(--text)', width: 40, height: 40, borderRadius: 10, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s', flexShrink: 0, cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >‹</button>
          <span style={{
            flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 18,
            color: 'var(--white)', textTransform: 'capitalize',
          }}>{nomeMes}</span>
          <button onClick={() => mudarMes(1)} style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            color: 'var(--text)', width: 40, height: 40, borderRadius: 10, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s', flexShrink: 0, cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >›</button>
        </div>

        {/* Lista de cultos */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="skeleton" style={{ minWidth: 50, height: 52, borderRadius: 10 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 14, width: '55%' }} />
                  <div className="skeleton" style={{ height: 11, width: '38%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : cultos.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', padding: 48,
            border: '1px dashed var(--border)', borderRadius: 14, background: 'var(--bg-card)',
          }}>
            Nenhum culto cadastrado para este mês.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cultos.map((culto, i) => {
              const data   = parseISO(culto.data)
              const accent = TIPO_CORES[culto.tipo] || 'var(--teal)'
              const isHoje = culto.data === new Date().toISOString().split('T')[0]
              return (
                <Link to={`/culto/${culto.id}`} key={culto.id}>
                  <div
                    className={`card-hover fade-in fade-in-delay-${Math.min(i + 1, 5)}`}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderLeft: `3px solid ${accent}`, borderRadius: 14,
                      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      minWidth: 50, textAlign: 'center',
                      background: 'var(--bg-card2)', borderRadius: 10, padding: '8px 0',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: accent, lineHeight: 1 }}>
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
                        display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
                      }}>
                        <span>{format(data, 'EEEE', { locale: ptBR })}</span>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {CULTO_TIPO_HORARIOS[culto.tipo]}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--teal)', fontSize: 16, opacity: 0.7 }}>›</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Calendário compacto — no final */}
        {cultos.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 2,
            }}>
              Visão do mês
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 12px',
            }}>
              {/* Cabeçalho */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                marginBottom: 6,
              }}>
                {DIAS_SEMANA.map((d, i) => (
                  <div key={i} style={{
                    textAlign: 'center',
                    fontSize: 10, fontWeight: 700,
                    color: i === 0 || i === 6 ? 'var(--teal-light)' : 'var(--text-muted)',
                    paddingBottom: 4,
                  }}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {Array.from({ length: totalCelulas }).map((_, idx) => {
                  const dia         = idx - offsetInicio + 1
                  const valido      = dia >= 1 && dia <= ultimoDia.getDate()
                  const cultosNoDia = valido ? (cultoPorDia[dia] || []) : []
                  const temCulto    = cultosNoDia.length > 0
                  const isHoje      = ehMesAtual && dia === hoje.getDate()
                  const isUltimaLinha = idx >= totalCelulas - 7

                  return (
                    <div
                      key={idx}
                      onClick={() => valido && handleDiaClick(dia)}
                      style={{
                        textAlign: 'center',
                        cursor: temCulto ? 'pointer' : 'default',
                        padding: '6px 2px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                        borderBottom: !isUltimaLinha ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (temCulto) e.currentTarget.style.background = 'rgba(26,125,111,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {valido && (
                        <>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: temCulto || isHoje ? 700 : 400,
                            background: isHoje ? 'var(--teal)' : 'transparent',
                            color: isHoje ? '#fff' : temCulto ? 'var(--white)' : 'var(--text-muted)',
                          }}>
                            {dia}
                          </div>
                          {temCulto && (
                            <div style={{ display: 'flex', gap: 3 }}>
                              {cultosNoDia.map(c => (
                                <div key={c.id} style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: TIPO_CORES[c.tipo] || 'var(--teal)',
                                  boxShadow: `0 0 4px ${TIPO_CORES[c.tipo]}88`,
                                }} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legenda inline */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
                marginTop: 12, paddingTop: 10,
                borderTop: '1px solid var(--border)',
              }}>
                {Object.entries(TIPO_CORES).map(([tipo, cor]) => (
                  <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {CULTO_TIPO_LABELS[tipo as Culto['tipo']]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
