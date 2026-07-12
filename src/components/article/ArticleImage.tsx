interface ArticleImageProps {
  src: string
  alt: string
  /** Bildens intrinsiska pixeldimensioner — krävs för att undvika layout-shift (CLS) */
  width: number
  height: number
  /** Valfri WebP-variant; PNG/JPG i src blir fallback */
  webpSrc?: string
  className?: string
}

export function ArticleImage({
  src,
  alt,
  width,
  height,
  webpSrc,
  className = 'w-full max-w-md rounded-lg my-4 h-auto',
}: ArticleImageProps) {
  const img = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
  if (!webpSrc) return img
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      {img}
    </picture>
  )
}
