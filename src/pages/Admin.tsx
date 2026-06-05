import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Culto, Membro, EscalaItem, Ministerio, MINISTERIO_LABELS, CULTO_TIPO_LABELS } from '../lib/types'
import MinisterioIcon from '../components/MinisterioIcon'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../lib/ThemeContext'

type Tab = 'cultos' | 'membros' | 'escalas'

export default function Admin() {
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState<Tab>('cultos')
  const [cultos, setCultos] = useState<Culto[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)

  // Form: novo culto
  const [novoCulto, setNovoCulto] = useState({ data: '', tipo: 'domingo-noite' as Culto['tipo'], titulo: '' })
  // Form: novo membro
  const [novoMembro, setNovoMembro] = useState({ nome: '', ministerio: 'louvor' as Ministerio })
  // Escala
  const [cultoSelecionado, setCultoSelecionado] = useState<string>('')
  const [escala, setEscala] = useState<EscalaItem[]>([])
  const [novaEscala, setNovaEscala] = useState({ membro_id: '', ministerio: 'louvor' as Ministerio, funcao: '' })

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (cultoSelecionado) fetchEscala(cultoSelecionado)
  }, [cultoSelecionado])

  async function fetchAll() {
    setLoading(true)
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('cultos').select('*').order('data', { ascending: true }),
      supabase.from('membros').select('*').order('nome'),
    ])
    setCultos(c || [])
    setMembros(m || [])
    setLoading(false)
  }

  async function fetchEscala(cultoId: string) {
    const { data } = await supabase
      .from('escalas')
      .select('*, membro:membros(*)')
      .eq('culto_id', cultoId)
    setEscala(data || [])
  }

  async function adicionarCulto() {
    if (!novoCulto.data) return
    await supabase.from('cultos').insert({
      data: novoCulto.data,
      tipo: novoCulto.tipo,
      titulo: novoCulto.titulo || null,
    })
    setNovoCulto({ data: '', tipo: 'domingo-noite', titulo: '' })
    fetchAll()
  }

  async function removerCulto(id: string) {
    await supabase.from('cultos').delete().eq('id', id)
    fetchAll()
  }

  async function adicionarMembro() {
    if (!novoMembro.nome) return
    await supabase.from('membros').insert(novoMembro)
    setNovoMembro({ nome: '', ministerio: 'louvor' })
    fetchAll()
  }

  async function removerMembro(id: string) {
    await supabase.from('membros').delete().eq('id', id)
    fetchAll()
  }

  function ordemDaFuncao(funcao: string): number {
    const f = funcao.toLowerCase()
    if (f.includes('dirigente')) return 1
    if (f.includes('oferta'))    return 2
    if (f.includes('palavra'))   return 3
    return 9
  }

  async function adicionarEscala() {
    if (!cultoSelecionado || !novaEscala.membro_id) return
    await supabase.from('escalas').insert({
      culto_id: cultoSelecionado,
      membro_id: novaEscala.membro_id,
      ministerio: novaEscala.ministerio,
      funcao: novaEscala.funcao || null,
      ordem: ordemDaFuncao(novaEscala.funcao),
    })
    setNovaEscala({ membro_id: '', ministerio: 'louvor', funcao: '' })
    fetchEscala(cultoSelecionado)
  }

  async function removerEscala(id: string) {
    await supabase.from('escalas').delete().eq('id', id)
    fetchEscala(cultoSelecionado)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '8px 12px', borderRadius: 8,
    fontSize: 14, outline: 'none', width: '100%',
  }

  const btnPrimary: React.CSSProperties = {
    background: 'var(--teal)', color: 'var(--white)',
    border: 'none', padding: '9px 18px', borderRadius: 8,
    fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
  }

  const btnDanger: React.CSSProperties = {
    background: 'transparent', color: '#e05555',
    border: '1px solid #e05555', padding: '4px 10px',
    borderRadius: 6, fontSize: 12,
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer',
    background: active ? 'var(--teal)' : 'var(--bg-card2)',
    color: active ? 'var(--white)' : 'var(--text-muted)',
  })

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12, padding: 20, marginBottom: 16,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 22 }}>‹</Link>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>Painel Admin</div>
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'cultos')} onClick={() => setTab('cultos')}>Cultos</button>
          <button style={tabStyle(tab === 'membros')} onClick={() => setTab('membros')}>Membros</button>
          <button style={tabStyle(tab === 'escalas')} onClick={() => setTab('escalas')}>Escalas</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>Carregando...</div>
        ) : (
          <>
            {/* ABA: CULTOS */}
            {tab === 'cultos' && (
              <div>
                <div style={cardStyle}>
                  <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--white)' }}>Adicionar culto</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="date" style={inputStyle} value={novoCulto.data}
                      onChange={e => setNovoCulto(p => ({ ...p, data: e.target.value }))} />
                    <select style={inputStyle} value={novoCulto.tipo}
                      onChange={e => setNovoCulto(p => ({ ...p, tipo: e.target.value as Culto['tipo'] }))}>
                      <option value="domingo-manha">Domingo manhã — Café com Deus</option>
                      <option value="domingo-noite">Domingo noite — Culto de Celebração</option>
                      <option value="terca">Terça — Culto Casa</option>
                      <option value="sabado-zion">Sábado — Zion</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input placeholder="Título personalizado (opcional)" style={{ ...inputStyle, flex: 1 }}
                        value={novoCulto.titulo}
                        onChange={e => setNovoCulto(p => ({ ...p, titulo: e.target.value }))} />
                      <button style={btnPrimary} onClick={adicionarCulto}>Adicionar</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cultos.map(c => {
                    const d = parseISO(c.data)
                    return (
                      <div key={c.id} style={{
                        ...cardStyle, marginBottom: 0,
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{
                          minWidth: 44, textAlign: 'center',
                          background: 'var(--bg-card2)', borderRadius: 8, padding: '6px 0',
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>
                            {format(d, 'dd')}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {format(d, 'MMM', { locale: ptBR })}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--white)' }}>
                            {c.titulo || CULTO_TIPO_LABELS[c.tipo]}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {format(d, 'EEEE', { locale: ptBR })}
                          </div>
                        </div>
                        <button style={btnDanger} onClick={() => removerCulto(c.id)}>Remover</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ABA: MEMBROS */}
            {tab === 'membros' && (
              <div>
                <div style={cardStyle}>
                  <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--white)' }}>Adicionar membro</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Nome completo" style={{ ...inputStyle, flex: 1 }}
                      value={novoMembro.nome}
                      onChange={e => setNovoMembro(p => ({ ...p, nome: e.target.value }))} />
                    <select style={{ ...inputStyle, width: 'auto' }} value={novoMembro.ministerio}
                      onChange={e => setNovoMembro(p => ({ ...p, ministerio: e.target.value as Ministerio }))}>
                      {(Object.entries(MINISTERIO_LABELS) as [Ministerio, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button style={btnPrimary} onClick={adicionarMembro}>Adicionar</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {membros.map(m => (
                    <div key={m.id} style={{
                      ...cardStyle, marginBottom: 0,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--bg-card2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--teal)',
                      }}>{m.nome.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--white)' }}>{m.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <MinisterioIcon ministerio={m.ministerio} size={13} color="var(--text-muted)" /> {MINISTERIO_LABELS[m.ministerio]}
                        </div>
                      </div>
                      <button style={btnDanger} onClick={() => removerMembro(m.id)}>Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA: ESCALAS */}
            {tab === 'escalas' && (
              <div>
                <div style={cardStyle}>
                  <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--white)' }}>Selecionar culto</div>
                  <select style={inputStyle} value={cultoSelecionado}
                    onChange={e => setCultoSelecionado(e.target.value)}>
                    <option value="">— Escolha um culto —</option>
                    {cultos.map(c => (
                      <option key={c.id} value={c.id}>
                        {format(parseISO(c.data), 'dd/MM')} — {c.titulo || CULTO_TIPO_LABELS[c.tipo]}
                      </option>
                    ))}
                  </select>
                </div>

                {cultoSelecionado && (
                  <>
                    <div style={cardStyle}>
                      <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--white)' }}>Adicionar à escala</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <select style={inputStyle} value={novaEscala.membro_id}
                          onChange={e => setNovaEscala(p => ({ ...p, membro_id: e.target.value }))}>
                          <option value="">— Selecione o membro —</option>
                          {membros.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select style={{ ...inputStyle, flex: 1 }} value={novaEscala.ministerio}
                            onChange={e => setNovaEscala(p => ({ ...p, ministerio: e.target.value as Ministerio }))}>
                            {(Object.entries(MINISTERIO_LABELS) as [Ministerio, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input placeholder="Função (ex: vocal, guitarra)" style={{ ...inputStyle, flex: 1 }}
                            value={novaEscala.funcao}
                            onChange={e => setNovaEscala(p => ({ ...p, funcao: e.target.value }))} />
                        </div>
                        <button style={btnPrimary} onClick={adicionarEscala}>Adicionar à escala</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {escala.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                          Nenhum membro escalado ainda.
                        </div>
                      ) : escala.map(item => (
                        <div key={item.id} style={{
                          ...cardStyle, marginBottom: 0,
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <MinisterioIcon ministerio={item.ministerio} size={17} color="var(--teal-light)" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--white)' }}>
                              {item.membro?.nome}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {MINISTERIO_LABELS[item.ministerio]}{item.funcao ? ` · ${item.funcao}` : ''}
                            </div>
                          </div>
                          <button style={btnDanger} onClick={() => removerEscala(item.id)}>Remover</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
