import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-900 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl',
          description: 'group-[.toast]:text-neutral-600',
          actionButton:
            'group-[.toast]:bg-primary-500 group-[.toast]:text-white group-[.toast]:rounded-xl',
          cancelButton:
            'group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-600 group-[.toast]:rounded-xl',
          error:
            'group-[.toaster]:bg-error-50 group-[.toaster]:text-error-900 group-[.toaster]:border-error-200',
          success:
            'group-[.toaster]:bg-success-50 group-[.toaster]:text-success-900 group-[.toaster]:border-success-200',
          warning:
            'group-[.toaster]:bg-warning-50 group-[.toaster]:text-warning-900 group-[.toaster]:border-warning-200',
          info: 'group-[.toaster]:bg-primary-50 group-[.toaster]:text-primary-900 group-[.toaster]:border-primary-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
