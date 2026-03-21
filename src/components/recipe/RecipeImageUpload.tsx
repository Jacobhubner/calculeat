import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRecipeImageUpload } from '@/hooks/useRecipeImageUpload'

interface RecipeImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
}

export function RecipeImageUpload({ value, onChange }: RecipeImageUploadProps) {
  const { t } = useTranslation('recipes')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { uploadImage, deleteImage, isUploading } = useRecipeImageUpload()

  async function handleFile(file: File) {
    const url = await uploadImage(file)
    if (url) {
      onChange(url)
    } else {
      toast.error(t('imageUpload.uploadError'))
    }
  }

  async function handleRemove() {
    if (value) {
      await deleteImage(value)
    }
    onChange(null)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">
          <img src={value} alt={t('imageUpload.altImage')} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={t('imageUpload.removeAlt')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`
            w-full aspect-video rounded-xl border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            transition-colors text-sm
            ${
              isDragOver
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-100'
            }
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t('imageUpload.uploading')}</span>
            </>
          ) : (
            <>
              <Camera className="h-6 w-6" />
              <span>{t('imageUpload.addImage')}</span>
              <span className="text-xs text-neutral-400">{t('imageUpload.dragHint')}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
