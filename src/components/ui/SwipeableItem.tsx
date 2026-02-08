import { ReactNode, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface SwipeableItemProps {
  children: ReactNode
  onSwipeLeft?: () => void
  threshold?: number
  className?: string
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  threshold = 80,
  className,
}: SwipeableItemProps) {
  const isMobile = useIsMobile()
  const x = useMotionValue(0)
  const [isSwiping, setIsSwiping] = useState(false)

  // Fade in the red background as user swipes
  const bgOpacity = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.5, 0])
  const iconScale = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.7, 0.5])

  if (!isMobile || !onSwipeLeft) {
    return <div className={className}>{children}</div>
  }

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false)
    if (info.offset.x < -threshold) {
      onSwipeLeft()
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className || ''}`}>
      {/* Red background revealed on swipe */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500 rounded-r-lg"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale }}>
          <Trash2 className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        className={`relative bg-neutral-50 ${isSwiping ? 'z-10' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  )
}
