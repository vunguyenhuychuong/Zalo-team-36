/** Icon inline (khong dung icon lib de giu bundle nho va chay offline). */
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconArrowRight = ({ size = 15 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconArrowUpRight = ({ size = 14 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

export const IconChevronDown = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconCheck = ({ size = 13 }: { size?: number }) => (
  <svg {...base} width={size} height={size} strokeWidth={3}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IconSparkles = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
)

export const IconLock = ({ size = 14 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

export const IconAlert = ({ size = 14 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
)

export const IconInbox = ({ size = 34 }: { size?: number }) => (
  <svg {...base} width={size} height={size} strokeWidth={1.5}>
    <path d="M4 13h4l2 3h4l2-3h4" />
    <path d="M4 13 6.5 5h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" />
  </svg>
)

export const IconBack = ({ size = 14 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
)
