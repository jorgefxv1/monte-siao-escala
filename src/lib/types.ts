export type Ministerio =
  | 'pregacao'
  | 'louvor'
  | 'recepcao'
  | 'midia'
  | 'live'
  | 'danca'
  | 'intercessao'
  | 'obreiros'

export const MINISTERIO_LABELS: Record<Ministerio, string> = {
  pregacao: 'Altar',
  louvor: 'Louvor',
  recepcao: 'Conexão',
  midia: 'Mídia',
  live: 'Live',
  danca: 'Dança',
  intercessao: 'Intercessão',
  obreiros: 'Obreiros',
}

export const MINISTERIO_ICONS: Record<Ministerio, string> = {
  pregacao: '🎤',
  louvor: '🎵',
  recepcao: '🤝',
  midia: '📽️',
  live: '📡',
  danca: '💃',
  intercessao: '🙏',
  obreiros: '🔧',
}

export interface Culto {
  id: string
  data: string
  tipo: 'domingo-manha' | 'domingo-noite' | 'terca' | 'sabado-zion'
  titulo: string
  created_at?: string
}

export interface Membro {
  id: string
  nome: string
  ministerio: Ministerio
  foto_url?: string
}

export interface EscalaItem {
  id: string
  culto_id: string
  membro_id: string
  ministerio: Ministerio
  funcao: string
  membro?: Membro
}

export const CULTO_TIPO_LABELS: Record<Culto['tipo'], string> = {
  'domingo-manha': 'Café com Deus',
  'domingo-noite': 'Culto de Celebração',
  'terca': 'Culto Casa',
  'sabado-zion': 'Zion',
}

export const TIPO_CORES: Record<Culto['tipo'], string> = {
  'domingo-manha': '#F59E0B',
  'domingo-noite': '#3b82f6',
  'terca':         '#22a090',
  'sabado-zion':   '#F472B6',
}

export function nameToColor(name: string): string {
  const palette = [
    '#2a7d6f', '#3b82f6', '#f59e0b', '#e05555',
    '#10b981', '#f97316', '#0ea5e9', '#a3845a',
    '#6a9e6a', '#c4616a',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export function funcaoColor(funcao: string | null | undefined): string {
  if (!funcao) return 'var(--teal-light)'
  const f = funcao.toLowerCase()
  if (f.includes('vocal') || f.includes('palavra')) return '#e8a020'
  return 'var(--teal-light)'
}

export const CULTO_TIPO_HORARIOS: Record<Culto['tipo'], string> = {
  'domingo-manha': '09h30',
  'domingo-noite': '18h30',
  'terca': '19h30',
  'sabado-zion': '18h00',
}
