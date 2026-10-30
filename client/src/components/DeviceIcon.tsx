import type { DeviceKind } from '../signaling/types'

const ICONS: Record<DeviceKind, string> = {
  Laptop: '💻',
  Handy: '📱',
  Tablet: '📲',
  Unknown: '❔',
}

export function DeviceIcon({ kind }: { kind: DeviceKind }) {
  return (
    <span role="img" aria-label={kind}>
      {ICONS[kind] ?? ICONS.Unknown}
    </span>
  )
}
