interface LemonCalculatorLogoProps {
  className?: string
  size?: number
  variant?: 'classic' | 'minimal' | 'outline' | 'gradient' | 'modern'
}

export default function LemonCalculatorLogo({
  className = '',
  size = 48,
  variant = 'classic',
}: LemonCalculatorLogoProps) {
  // Classic - solid yellow lemon with white bars
  if (variant === 'classic') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lemon body */}
        <ellipse cx="50" cy="55" rx="30" ry="38" fill="#f9ca24" />

        {/* Top stem/tip */}
        <path d="M 48 17 Q 50 12, 52 17 L 52 20 L 48 20 Z" fill="#2d7a4f" />

        {/* Leaf */}
        <path d="M 52 15 Q 60 12, 64 18 Q 66 22, 62 25 Q 56 26, 52 22 Z" fill="#27ae60" />

        {/* Calculator bars - progressive length from left */}
        <g className="calculator-bars">
          {/* Top bar - shortest */}
          <rect x="28" y="45" width="18" height="4" rx="2" fill="white" opacity="0.95" />

          {/* Middle bar - medium */}
          <rect x="28" y="55" width="28" height="4" rx="2" fill="white" opacity="0.95" />

          {/* Bottom bar - longest */}
          <rect x="28" y="65" width="38" height="4" rx="2" fill="white" opacity="0.95" />
        </g>
      </svg>
    )
  }

  // Minimal - simple outline with subtle bars
  if (variant === 'minimal') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lemon outline */}
        <ellipse
          cx="50"
          cy="55"
          rx="30"
          ry="38"
          fill="#fef5cd"
          stroke="#f9ca24"
          strokeWidth="2.5"
        />

        {/* Small leaf */}
        <path d="M 52 18 Q 58 16, 60 20 Q 60 23, 56 24 Q 52 23, 52 20 Z" fill="#27ae60" />

        {/* Thin calculator bars */}
        <g className="calculator-bars">
          <rect x="30" y="47" width="15" height="3" rx="1.5" fill="#f39c12" />
          <rect x="30" y="55" width="24" height="3" rx="1.5" fill="#f39c12" />
          <rect x="30" y="63" width="33" height="3" rx="1.5" fill="#f39c12" />
        </g>
      </svg>
    )
  }

  // Outline - line art style
  if (variant === 'outline') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lemon outline only */}
        <ellipse cx="50" cy="55" rx="30" ry="38" stroke="#f9ca24" strokeWidth="3" fill="none" />

        {/* Leaf outline */}
        <path
          d="M 52 18 Q 58 16, 60 20 Q 60 23, 56 24 Q 52 23, 52 20 Z"
          stroke="#27ae60"
          strokeWidth="2"
          fill="none"
        />

        {/* Bold calculator bars */}
        <g className="calculator-bars" stroke="#f9ca24" strokeWidth="3.5" strokeLinecap="round">
          <line x1="30" y1="48" x2="45" y2="48" />
          <line x1="30" y1="55" x2="54" y2="55" />
          <line x1="30" y1="62" x2="63" y2="62" />
        </g>
      </svg>
    )
  }

  // Gradient - modern gradient style
  if (variant === 'gradient') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lemonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f9ca24" />
            <stop offset="100%" stopColor="#f39c12" />
          </linearGradient>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Lemon with gradient */}
        <ellipse cx="50" cy="55" rx="30" ry="38" fill="url(#lemonGradient)" />

        {/* Leaf */}
        <path d="M 52 18 Q 58 16, 60 20 Q 60 23, 56 24 Q 52 23, 52 20 Z" fill="#27ae60" />

        {/* Gradient bars */}
        <g className="calculator-bars">
          <rect x="28" y="46" width="18" height="4" rx="2" fill="url(#barGradient)" />
          <rect x="28" y="54" width="28" height="4" rx="2" fill="url(#barGradient)" />
          <rect x="28" y="62" width="38" height="4" rx="2" fill="url(#barGradient)" />
        </g>
      </svg>
    )
  }

  // Modern - flat design with shadows
  if (variant === 'modern') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="50" cy="92" rx="25" ry="4" fill="#000000" opacity="0.1" />

        {/* Lemon body */}
        <ellipse cx="50" cy="55" rx="30" ry="38" fill="#feca57" />

        {/* Highlight */}
        <ellipse cx="42" cy="40" rx="12" ry="16" fill="#ffffff" opacity="0.3" />

        {/* Leaf with detail */}
        <path d="M 52 18 Q 58 16, 61 20 Q 62 24, 57 25 Q 52 24, 52 20 Z" fill="#26de81" />
        <path d="M 54 20 Q 57 19, 58 22" stroke="#20bf6b" strokeWidth="1" opacity="0.6" />

        {/* Modern flat bars */}
        <g className="calculator-bars">
          <rect x="30" y="46" width="17" height="3.5" rx="1.75" fill="#ffffff" opacity="0.95" />
          <rect x="30" y="54" width="27" height="3.5" rx="1.75" fill="#ffffff" opacity="0.95" />
          <rect x="30" y="62" width="37" height="3.5" rx="1.75" fill="#ffffff" opacity="0.95" />
        </g>
      </svg>
    )
  }

  return null
}
