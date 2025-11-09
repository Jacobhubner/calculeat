import { ImageIcon } from 'lucide-react'

interface ImagePlaceholderProps {
  /**
   * Beskrivande text för vad bilden ska föreställa
   */
  description: string
  /**
   * Föreslaget filnamn för bilden
   */
  filename: string
  /**
   * Bredd i pixlar (default: 400)
   */
  width?: number
  /**
   * Höjd i pixlar (default: 300)
   */
  height?: number
  /**
   * Aspect ratio klasser (override width/height)
   * Ex: "aspect-video", "aspect-square"
   */
  aspectRatio?: string
  /**
   * Rundade hörn (default: "rounded-2xl")
   */
  rounded?: string
  /**
   * Extra CSS klasser
   */
  className?: string
}

export function ImagePlaceholder({
  description,
  filename,
  width = 400,
  height = 300,
  aspectRatio,
  rounded = 'rounded-2xl',
  className = '',
}: ImagePlaceholderProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-3
        border-2 border-dashed border-neutral-300 bg-neutral-100
        ${rounded} p-6 text-center
        ${aspectRatio || ''}
        ${className}
      `}
      style={aspectRatio ? undefined : { width: `${width}px`, height: `${height}px` }}
    >
      <ImageIcon className="h-12 w-12 text-neutral-400" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-700">{description}</p>
        <p className="text-xs font-mono text-neutral-500 bg-neutral-200 px-2 py-1 rounded">
          {filename}
        </p>
        {!aspectRatio && (
          <p className="text-xs text-neutral-400">
            {width} × {height}px
          </p>
        )}
      </div>
    </div>
  )
}
