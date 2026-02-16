import { useRef, useState, useCallback } from 'react'
import Quagga from '@ericblade/quagga2'
import { Button } from '@/components/ui/button'
import { X, Camera } from 'lucide-react'

interface BarcodeScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (barcode: string) => void
}

type CameraError = 'denied' | 'not_found' | 'not_secure' | 'unknown'

function getCameraErrorMessage(error: CameraError): string {
  switch (error) {
    case 'denied':
      return 'Du behöver ge kamerabehörighet för att skanna'
    case 'not_found':
      return 'Ingen kamera hittades på denna enhet'
    case 'not_secure':
      return 'Kameraskanning kräver en säker anslutning (HTTPS)'
    case 'unknown':
      return 'Kunde inte starta kameran'
  }
}

function classifyCameraError(err: unknown): CameraError {
  if (!window.isSecureContext) return 'not_secure'
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') return 'denied'
    if (err.name === 'NotFoundError' || err.name === 'NotReadableError') return 'not_found'
    if (err.name === 'OverconstrainedError') return 'not_found'
  }
  return 'unknown'
}

export function BarcodeScannerModal({ open, onOpenChange, onDetected }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectedRef = useRef(false)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    detectedRef.current = false
    setCameraReady(false)
    setCameraError(null)
  }, [])

  const handleClose = useCallback(() => {
    stopAll()
    onOpenChange(false)
  }, [stopAll, onOpenChange])

  // Start camera from user gesture (button click) to satisfy iOS autoplay policy
  const startCamera = useCallback(async () => {
    stopAll()
    detectedRef.current = false

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
    } catch (err) {
      setCameraError(classifyCameraError(err))
      return
    }

    streamRef.current = stream

    const video = videoRef.current
    if (!video) {
      stream.getTracks().forEach(t => t.stop())
      streamRef.current = null
      return
    }

    video.srcObject = stream

    try {
      await video.play()
    } catch {
      // Ignore play errors
    }

    setCameraReady(true)

    // Start decoding
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
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            onDetected(code)
            handleClose()
          }
        }
      )
    }, 400)
  }, [stopAll, onDetected, handleClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">Skanna streckkod</span>
        </div>
        <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/20">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex items-center justify-center px-4">
        {cameraError ? (
          <div className="flex flex-col items-center text-center">
            <Camera className="h-12 w-12 text-neutral-400 mb-4" />
            <p className="text-sm text-neutral-300 mb-4">{getCameraErrorMessage(cameraError)}</p>
            <Button variant="outline" onClick={handleClose}>
              Stäng
            </Button>
          </div>
        ) : !cameraReady ? (
          <div className="flex flex-col items-center text-center">
            <Camera className="h-16 w-16 text-white/60 mb-6" />
            <Button
              onClick={startCamera}
              className="bg-white text-black hover:bg-white/90 text-base px-8 py-3"
            >
              Starta kameran
            </Button>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-1/4 border-2 border-white/60 rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex justify-center shrink-0">
        <Button
          variant="outline"
          className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="h-4 w-4 mr-1.5" />
          Avbryt
        </Button>
      </div>

      {/* Always mount video element so ref is available */}
      {!cameraReady && <video ref={videoRef} className="hidden" playsInline muted />}
    </div>
  )
}
