interface LemonLogoVariantProps {
  className?: string
  size?: number
  variant?:
    | 'original' // Som bilden - orange citron med grönt/orange text
    | 'solid' // En färg genom hela logotypen
    | 'duotone' // Två färger genomgående
    | 'vibrant' // Starkare färger
    | 'pastel' // Mjukare pastellfärger
    | 'dark' // Mörk variant
    | 'simple' // Superenkelt, bara citron
}

export default function LemonLogoVariants({
  className = '',
  size = 120,
  variant = 'original',
}: LemonLogoVariantProps) {
  // Original - som bilden (orange citron, grön "Calcul", orange "Eat")
  if (variant === 'original') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        {/* Lemon icon */}
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lemon body - orange/yellow */}
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#f39c12" />

          {/* White horizontal lines */}
          <rect x="25" y="42" width="20" height="4" rx="2" fill="white" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="white" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="white" />
        </svg>

        {/* Text */}
        <div style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: '#52b788' }}>Calcul</span>
          <span style={{ color: '#e76f51' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Solid - en genomgående färg (grönt tema)
  if (variant === 'solid') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#52b788" />
          <rect x="25" y="42" width="20" height="4" rx="2" fill="white" opacity="0.9" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="white" opacity="0.9" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="white" opacity="0.9" />
        </svg>
        <div style={{ fontSize: size * 0.35, fontWeight: 700, color: '#52b788' }}>CalculEat</div>
      </div>
    )
  }

  // Duotone - två färger (gul citron, grön text)
  if (variant === 'duotone') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#f9ca24" />
          <rect x="25" y="42" width="20" height="4" rx="2" fill="#52b788" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="#52b788" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="#52b788" />
        </svg>
        <div style={{ fontSize: size * 0.35, fontWeight: 700, color: '#52b788' }}>CalculEat</div>
      </div>
    )
  }

  // Vibrant - kraftiga färger (stark gul citron, rosa/orange text split)
  if (variant === 'vibrant') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#ffd93d" />
          <rect x="25" y="42" width="20" height="4" rx="2" fill="#ff6b6b" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="#ff6b6b" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="#ff6b6b" />
        </svg>
        <div style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: '#4ecdc4' }}>Calcul</span>
          <span style={{ color: '#ff6b6b' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Pastel - mjuka pastellfärger
  if (variant === 'pastel') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#ffe5b4" />
          <rect x="25" y="42" width="20" height="4" rx="2" fill="#a8dadc" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="#a8dadc" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="#a8dadc" />
        </svg>
        <div style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: '#a8dadc' }}>Calcul</span>
          <span style={{ color: '#f1a5a8' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Dark - mörk variant (för dark mode)
  if (variant === 'dark') {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
        <svg
          viewBox="0 0 100 100"
          style={{ height: size * 0.6, width: size * 0.6 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="55" rx="32" ry="40" fill="#2d3748" />
          <rect x="25" y="42" width="20" height="4" rx="2" fill="#63b3ed" />
          <rect x="25" y="52" width="32" height="4" rx="2" fill="#63b3ed" />
          <rect x="25" y="62" width="42" height="4" rx="2" fill="#63b3ed" />
        </svg>
        <div style={{ fontSize: size * 0.35, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: '#63b3ed' }}>Calcul</span>
          <span style={{ color: '#fc8181' }}>Eat</span>
        </div>
      </div>
    )
  }

  // Simple - bara citronen, ingen text
  if (variant === 'simple') {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{ height: size, width: size }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <ellipse cx="50" cy="50" rx="35" ry="42" fill="#f39c12" />
        <rect x="22" y="35" width="22" height="5" rx="2.5" fill="white" />
        <rect x="22" y="47" width="35" height="5" rx="2.5" fill="white" />
        <rect x="22" y="59" width="46" height="5" rx="2.5" fill="white" />
      </svg>
    )
  }

  return null
}
