import { DEVICE_LABEL } from '../../lib/deviceLabel'
import type { DeviceKind } from '../../signaling/types'

const PATHS: Record<DeviceKind, string> = {
  Laptop: 'M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V16H5zM2.5 16h19v.5a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5z',
  Handy: 'M8.5 2.5h7A1.5 1.5 0 0 1 17 4v16a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20V4a1.5 1.5 0 0 1 1.5-1.5zM11 18.5h2',
  Tablet: 'M6.5 2.5h11A1.5 1.5 0 0 1 19 4v16a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5zM11 18.5h2',
  Unknown: 'M5 5.5h14v10H5zM9 19.5h6M12 15.5v4',
}

export function DeviceIcon({ kind, size = 24 }: { kind: DeviceKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={DEVICE_LABEL[kind] ?? DEVICE_LABEL.Unknown}
    >
      <path d={PATHS[kind] ?? PATHS.Unknown} />
    </svg>
  )
}
