import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Quagga from '@ericblade/quagga2'
import { Button } from '@/components/ui/button'
import { X, Camera } from 'lucide-react'

interface BarcodeScannerModalProps {
  /** The live camera stream — acquired in the click handler (user gesture) */
  stream: MediaStream | null
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScannerModal({ stream, onDetected, onClose }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectedRef = useRef(false)

  const stopDecoding = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!stream) return

    detectedRef.current = false
    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    video.play().catch(() => {})

    // Start decoding frames
    intervalRef.current = setInterval(() => {
      if (detectedRef.current) return

      const v = videoRef.current
      const canvas = canvasRef.current
      if (!v || !canvas || v.videoWidth === 0) return

      canvas.width = v.videoWidth
      canvas.height = v.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

      Quagga.decodeSingle(
        {
          src: dataUrl,
          numOfWorkers: 0,
          decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader'] },
          locate: true,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any) => {
          const code = result?.codeResult?.code as string | undefined
          if (code && !detectedRef.current) {
            detectedRef.current = true
            stopDecoding()
            onDetected(code)
          }
        }
      )
    }, 400)

    return () => {
      stopDecoding()
      video.srcObject = null
    }
  }, [stream, onDetected, stopDecoding])

  if (!stream) return null

  return createPortal(
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">Skanna streckkod</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-1/4 border-2 border-white/60 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="p-4 flex justify-center shrink-0">
        <Button
          variant="outline"
          className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-4 w-4 mr-1.5" />
          Avbryt
        </Button>
      </div>
    </div>,
    document.body
  )
}
