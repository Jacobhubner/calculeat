import { cn } from '@/lib/utils'

interface LogoProps {
  /** Klasser för storlek/animation — appliceras på båda varianterna. */
  className?: string
  style?: React.CSSProperties
  alt?: string
}

/**
 * Calculeat-loggan med mörkerläge-variant.
 *
 * Ordmärket är svart i originalet och försvann mot mörk bakgrund. En `<img>`
 * kan inte byta `src` via `dark:`, och `<picture>` med prefers-color-scheme
 * hade bara följt systemet — inte temavalet, som här styrs av `.dark` på
 * <html> och kan avvika från systemet.
 *
 * Därför renderas båda filerna och CSS döljer den ena. Ingen extra
 * nätverksbegäran i praktiken: SVG:erna är ~8 kB och cachade, och båda
 * ligger i samma layoutflöde via grid-stapling så ingen höjd dubbleras.
 */
export function Logo({ className, style, alt = 'Calculeat' }: LogoProps) {
  return (
    <span className="grid [&>*]:col-start-1 [&>*]:row-start-1">
      <img
        src="/calculeat-logo-full.svg"
        alt={alt}
        style={style}
        className={cn('dark:hidden', className)}
      />
      <img
        src="/calculeat-logo-full-dark.svg"
        // Dekorativ dubblett — ljusa varianten bär redan alt-texten, så att
        // låta båda ha den skulle läsa upp namnet två gånger.
        alt=""
        aria-hidden="true"
        style={style}
        className={cn('hidden dark:block', className)}
      />
    </span>
  )
}
