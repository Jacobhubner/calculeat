import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-900 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl dark:group-[.toaster]:bg-neutral-850 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-700 dark:group-[.toaster]:shadow-black/40',
          description: 'group-[.toast]:text-neutral-600 dark:group-[.toast]:text-neutral-400',
          actionButton:
            'group-[.toast]:bg-primary-500 group-[.toast]:text-white group-[.toast]:rounded-xl',
          cancelButton:
            'group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-600 group-[.toast]:rounded-xl dark:group-[.toast]:bg-neutral-800 dark:group-[.toast]:text-neutral-300',
          error:
            'group-[.toaster]:bg-error-50 group-[.toaster]:text-error-900 group-[.toaster]:border-error-200 dark:group-[.toaster]:bg-error-900/30 dark:group-[.toaster]:text-error-300 dark:group-[.toaster]:border-error-900',
          success:
            'group-[.toaster]:bg-success-50 group-[.toaster]:text-success-900 group-[.toaster]:border-success-200 dark:group-[.toaster]:bg-success-900/30 dark:group-[.toaster]:text-success-300 dark:group-[.toaster]:border-success-900',
          // `warning-*` saknar skala i @theme (src/index.css) och kompilerar inte
          // till någon CSS — orange används i stället, samma ton som Alert/Badge.
          warning:
            'group-[.toaster]:bg-warning-50 group-[.toaster]:text-warning-900 group-[.toaster]:border-warning-200 dark:group-[.toaster]:bg-warning-900/30 dark:group-[.toaster]:text-warning-300 dark:group-[.toaster]:border-warning-900',
          info: 'group-[.toaster]:bg-primary-50 group-[.toaster]:text-primary-900 group-[.toaster]:border-primary-200 dark:group-[.toaster]:bg-primary-900/30 dark:group-[.toaster]:text-primary-300 dark:group-[.toaster]:border-primary-900',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
