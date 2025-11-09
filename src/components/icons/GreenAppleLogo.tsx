interface GreenAppleLogoProps {
  className?: string
  size?: number
  variant?: 'classic' | 'minimal' | 'bold' | 'rounded' | 'flat'
}

export default function GreenAppleLogo({
  className = '',
  size = 120,
  variant = 'classic',
}: GreenAppleLogoProps) {
  // Classic - standard green apple with leaf
  if (variant === 'classic') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size * 0.5 }}>
        {/* Green Apple Icon */}
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.5, width: size * 0.5 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Apple body - green */}
          <circle cx="50" cy="55" r="32" fill="#6FCF97" />

          {/* Stem */}
          <rect x="48" y="23" width="4" height="12" rx="2" fill="#8B4513" />

          {/* Leaf */}
          <ellipse cx="58" cy="26" rx="10" ry="6" fill="#52b788" transform="rotate(-25 58 26)" />

          {/* Highlight */}
          <ellipse cx="38" cy="42" rx="10" ry="14" fill="#FFFFFF" opacity="0.3" />
        </svg>

        {/* Text with color split */}
        <div
          style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Minimal - lighter, more subtle apple
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size * 0.5 }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.5, width: size * 0.5 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Apple outline */}
          <circle cx="50" cy="55" r="32" fill="#B8E6C9" stroke="#6FCF97" strokeWidth="2" />
          <rect x="48" y="23" width="3" height="10" rx="1.5" fill="#8B4513" />
          <ellipse
            cx="57"
            cy="25"
            rx="8"
            ry="5"
            fill="#52b788"
            opacity="0.8"
            transform="rotate(-25 57 25)"
          />
          <ellipse cx="38" cy="42" rx="8" ry="12" fill="#FFFFFF" opacity="0.4" />
        </svg>

        <div
          style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Bold - darker, more vibrant green
  if (variant === 'bold') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size * 0.5 }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.5, width: size * 0.5 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="55" r="32" fill="#27ae60" />
          <rect x="48" y="23" width="4" height="12" rx="2" fill="#6d4c41" />
          <ellipse cx="58" cy="26" rx="10" ry="6" fill="#2ecc71" transform="rotate(-25 58 26)" />
          <ellipse cx="38" cy="42" rx="10" ry="14" fill="#FFFFFF" opacity="0.25" />
        </svg>

        <div
          style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Rounded - softer, rounded apple
  if (variant === 'rounded') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size * 0.5 }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.5, width: size * 0.5 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rounded apple shape */}
          <path
            d="M 50 23 Q 30 30, 25 50 Q 25 75, 50 87 Q 75 75, 75 50 Q 70 30, 50 23 Z"
            fill="#6FCF97"
          />
          <rect x="48" y="15" width="4" height="12" rx="2" fill="#8B4513" />
          <ellipse cx="58" cy="18" rx="10" ry="6" fill="#52b788" transform="rotate(-25 58 18)" />
          <ellipse cx="38" cy="40" rx="10" ry="14" fill="#FFFFFF" opacity="0.3" />
        </svg>

        <div
          style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Flat - modern flat design
  if (variant === 'flat') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size * 0.5 }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.5, width: size * 0.5 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="55" r="32" fill="#6FCF97" />
          <rect x="47" y="23" width="6" height="10" rx="3" fill="#7cb342" />
          <ellipse cx="60" cy="25" rx="12" ry="7" fill="#81c784" transform="rotate(-25 60 25)" />
        </svg>

        <div
          style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  return null
}
