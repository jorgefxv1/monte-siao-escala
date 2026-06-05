import {
  BookOpen, Music, Users, Monitor, Radio,
  PersonStanding, HandHeart, Cog,
} from 'lucide-react'
import { Ministerio } from '../lib/types'

const ICON_MAP: Record<Ministerio, React.ElementType> = {
  pregacao:    BookOpen,
  louvor:      Music,
  recepcao:    Users,
  midia:       Monitor,
  live:        Radio,
  danca:       PersonStanding,
  intercessao: HandHeart,
  obreiros:    Cog,
}

interface Props {
  ministerio: Ministerio
  size?: number
  color?: string
}

export default function MinisterioIcon({ ministerio, size = 22, color = 'currentColor' }: Props) {
  const Icon = ICON_MAP[ministerio]
  return <Icon size={size} color={color} strokeWidth={1.75} />
}
