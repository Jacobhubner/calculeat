import { useEffect, useRef, useState, useCallback } from 'react'
import Quagga from '@ericblade/quagga2'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    if (err.name === 'NotFoundError') return 'not_found'
  }
  return 'unknown'
}

export function BarcodeScannerModal({ open, onOpenChange, onDetected }: BarcodeScannerModalProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const detectedRef = useRef(false)
  const cameraErrorRef = useRef<CameraError | null>(null)
  const initializingRef = useRef(false)

  const stopScanner = useCallback(() => {
    try {
      Quagga.stop()
    } catch {
      // Already stopped
    }
  }, [])

  const handleClose = useCallback(() => {
    stopScanner()
    detectedRef.current = false
    setCameraError(null)
    onOpenChange(false)
  }, [stopScanner, onOpenChange])

  useEffect(() => {
    if (!open || !scannerRef.current) return

    detectedRef.current = false
    cameraErrorRef.current = null
    initializingRef.current = true

    const timer = setTimeout(() => {
      if (!scannerRef.current) return

      // Batch state updates after the microtask (inside callback)
      setCameraError(null)
      setIsInitializing(true)

      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target: scannerRef.current,
            constraints: {
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          },
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'upc_reader'],
          },
          locate: true,
          frequency: 10,
        },
        (err: unknown) => {
          setIsInitializing(false)
          if (err) {
            setCameraError(classifyCameraError(err))
            return
          }
          Quagga.start()
        }
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Quagga.onDetected((result: any) => {
        const code = result?.codeResult?.code as string | undefined
        if (code && !detectedRef.current) {
          detectedRef.current = true
          stopScanner()
          onDetected(code)
          onOpenChange(false)
        }
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      stopScanner()
      Quagga.offDetected()
    }
  }, [open, onDetected, onOpenChange, stopScanner])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Skanna streckkod
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Camera className="h-12 w-12 text-neutral-300 mb-4" />
              <p className="text-sm text-neutral-700 mb-4">{getCameraErrorMessage(cameraError)}</p>
              <Button variant="outline" onClick={handleClose}>
                Stäng
              </Button>
            </div>
          ) : (
            <>
              <div
                ref={scannerRef}
                className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden"
              />
              {/* Guide overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-1/3 border-2 border-white/60 rounded-lg" />
              </div>
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <p className="text-white text-sm">Startar kameran...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            Avbryt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
