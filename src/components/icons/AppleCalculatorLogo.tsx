interface AppleCalculatorLogoProps {
  className?: string
  size?: number
}

export default function AppleCalculatorLogo({
  className = '',
  size = 48,
}: AppleCalculatorLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf */}
      <path
        d="M 58 12 Q 65 8, 72 12 Q 78 16, 75 24 Q 72 30, 65 28 Q 60 26, 58 20 Z"
        fill="#2d7a4f"
        className="leaf"
      />

      {/* Apple body */}
      <circle cx="50" cy="55" r="35" fill="#f9ca24" className="apple-body" />

      {/* Stem */}
      <path d="M 55 20 Q 56 18, 58 20 L 58 28 Q 56 26, 55 28 Z" fill="#2d7a4f" className="stem" />

      {/* Calculator lines (3 horizontal bars) */}
      <g className="calculator-lines">
        {/* Top line */}
        <rect x="30" y="42" width="40" height="5" rx="2" fill="white" />

        {/* Middle line */}
        <rect x="25" y="54" width="50" height="5" rx="2" fill="white" />

        {/* Bottom line */}
        <rect x="20" y="66" width="60" height="5" rx="2" fill="white" />
      </g>
    </svg>
  )
}
