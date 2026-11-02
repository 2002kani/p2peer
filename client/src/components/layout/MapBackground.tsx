import styles from './MapBackground.module.css'

// hand drawn, pale city map; purely decorative
const WATER = [
  'M0 110C60 85 125 130 112 200 100 262 35 285 0 272Z',
  'M120 300C170 262 232 282 212 322 192 352 130 346 120 300Z',
  'M252 400C302 340 382 372 372 442 366 492 412 522 382 562 342 612 270 592 250 542 230 492 212 452 252 400Z',
  'M1240 118C1292 88 1342 130 1322 200 1302 262 1252 282 1230 232 1214 190 1204 146 1240 118Z',
  'M1600 410C1518 424 1488 500 1520 580 1550 652 1600 664 1600 664Z',
  'M1180 852C1240 790 1362 800 1392 862 1422 922 1342 962 1262 952 1190 942 1140 902 1180 852Z',
  'M1388 650C1408 636 1432 646 1426 668 1420 686 1394 684 1388 650Z',
]

const PARKS = [
  'M620 140C682 110 742 142 722 192 702 232 620 222 610 182Z',
  'M240 160C268 140 300 156 292 182 284 204 246 200 240 160Z',
  'M120 782C192 740 262 772 252 822 242 862 150 862 120 822Z',
  'M1290 362C1322 340 1352 362 1342 392 1332 412 1290 406 1290 362Z',
  'M470 930C520 910 562 940 542 970 512 992 470 972 470 930Z',
  'M1440 822C1492 800 1542 832 1522 872 1502 902 1440 882 1440 822Z',
]

const MAJOR_ROADS = [
  'M-50 200C300 320 520 380 800 460S1300 600 1650 640',
  'M700-50C690 200 640 300 650 500S720 850 760 1050',
  'M-50 620C300 560 600 640 900 600S1400 360 1650 300',
  'M180 1050C260 820 120 700 160 520S120 220 40-50',
]

const MINOR_ROADS = [
  'M-20 900C300 820 500 860 700 780',
  'M1000-50C1050 200 1000 350 1100 500S1250 800 1200 1050',
  'M300-50C350 200 200 400 260 600S420 900 380 1050',
  'M1100 200 1650 110',
  'M-20 420C200 440 400 380 500 300S700 120 900 60',
  'M900 700C1000 760 1100 800 1300 780S1500 720 1650 760',
  'M450 650C500 750 560 800 700 820',
  'M1350-20C1400 300 1450 500 1650 520',
  'M820 100C860 260 980 300 1040 420',
  'M120 1050C200 950 180 860 260 760',
]

export function MapBackground() {
  return (
    <svg className={styles.map} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="map-wash">
          <stop offset="0" stopColor="var(--map-land)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--map-land)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="1000" fill="var(--map-land)" />
      {WATER.map((d) => (
        <path key={d} d={d} className={styles.water} />
      ))}
      {PARKS.map((d) => (
        <path key={d} d={d} className={styles.park} />
      ))}

      <g className={styles.roadEdge}>
        {MINOR_ROADS.map((d) => (
          <path key={d} d={d} strokeWidth={5} />
        ))}
        {MAJOR_ROADS.map((d) => (
          <path key={d} d={d} strokeWidth={11} />
        ))}
      </g>
      <g className={styles.road}>
        {MINOR_ROADS.map((d) => (
          <path key={d} d={d} strokeWidth={3} />
        ))}
        {MAJOR_ROADS.map((d) => (
          <path key={d} d={d} strokeWidth={8} />
        ))}
      </g>

      <ellipse cx="800" cy="500" rx="560" ry="420" fill="url(#map-wash)" />
    </svg>
  )
}
