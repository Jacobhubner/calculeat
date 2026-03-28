import { useEffect, useRef, useCallback, useReducer } from 'react'
import { createPortal } from 'react-dom'
import Quagga from '@ericblade/quagga2'
import { Button } from '@/components/ui/button'
import { X, Camera, Flashlight } from 'lucide-react'

interface BarcodeScannerModalProps {
  /** The live camera stream — acquired in the click handler (user gesture) */
  stream: MediaStream | null
  onDetected: (barcode: string) => void
  /** Fired on first detection (before confirmation) — use for predictive lookup */
  onPreliminaryDetect?: (barcode: string) => void
  onClose: () => void
}

type ScanState = {
  pendingCode: string | null
  isStabilizing: boolean
  isTooKark: boolean
  torchOn: boolean
  torchSupported: boolean
}

type ScanAction =
  | { type: 'RESET'; torchSupported: boolean }
  | { type: 'SCANNING_STARTED' }
  | { type: 'PENDING_CODE'; code: string }
  | { type: 'LOST_CODE' }
  | { type: 'TOO_DARK'; value: boolean }
  | { type: 'TORCH_TOGGLE' }

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'RESET':
      return {
        pendingCode: null,
        isStabilizing: true,
        isTooKark: false,
        torchOn: false,
        torchSupported: action.torchSupported,
      }
    case 'SCANNING_STARTED':
      return { ...state, isStabilizing: false }
    case 'PENDING_CODE':
      return { ...state, pendingCode: action.code }
    case 'LOST_CODE':
      return { ...state, pendingCode: null }
    case 'TOO_DARK':
      return { ...state, isTooKark: action.value }
    case 'TORCH_TOGGLE':
      return { ...state, torchOn: !state.torchOn }
    default:
      return state
  }
}

export function BarcodeScannerModal({
  stream,
  onDetected,
  onPreliminaryDetect,
  onClose,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stabilizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detectedRef = useRef(false)
  const lastCodeRef = useRef<string | null>(null)
  const consecutiveRef = useRef(0)
  const startTimeRef = useRef<number>(0)
  const currentIntervalRef = useRef<number>(300)
  const brightnessSampleCountRef = useRef(0)
  // Keep callbacks in refs so startDecoding never needs to re-create when props change
  const onDetectedRef = useRef(onDetected)
  const onPreliminaryDetectRef = useRef(onPreliminaryDetect)
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])
  useEffect(() => {
    onPreliminaryDetectRef.current = onPreliminaryDetect
  }, [onPreliminaryDetect])

  const [state, dispatch] = useReducer(scanReducer, {
    pendingCode: null,
    isStabilizing: true,
    isTooKark: false,
    torchOn: false,
    torchSupported: false,
  })

  const stopDecoding = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (stabilizeTimerRef.current) {
      clearTimeout(stabilizeTimerRef.current)
      stabilizeTimerRef.current = null
    }
  }, [])

  // Toggle torch
  const handleTorchToggle = useCallback(async () => {
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    const newState = !state.torchOn
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track as any).applyConstraints({ advanced: [{ torch: newState }] })
      dispatch({ type: 'TORCH_TOGGLE' })
    } catch {
      // Torch not supported on this device
    }
  }, [stream, state.torchOn])

  const startDecoding = useCallback(() => {
    dispatch({ type: 'SCANNING_STARTED' })
    startTimeRef.current = Date.now()
    currentIntervalRef.current = 300

    const runTick = () => {
      if (detectedRef.current) return

      const v = videoRef.current
      const canvas = canvasRef.current
      if (!v || !canvas || v.videoWidth === 0) return

      const tickStart = performance.now()

      canvas.width = v.videoWidth
      canvas.height = v.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)

      // Brightness check every ~10 ticks
      brightnessSampleCountRef.current++
      if (brightnessSampleCountRef.current % 10 === 0) {
        const sampleSize = 50
        const cx = Math.floor(canvas.width / 2 - sampleSize / 2)
        const cy = Math.floor(canvas.height / 2 - sampleSize / 2)
        const imageData = ctx.getImageData(cx, cy, sampleSize, sampleSize)
        const pixels = imageData.data
        let total = 0
        for (let i = 0; i < pixels.length; i += 4) {
          total += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
        }
        const avgLuminance = total / (pixels.length / 4)
        dispatch({ type: 'TOO_DARK', value: avgLuminance < 40 })
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      const timeSinceStart = Date.now() - startTimeRef.current

      Quagga.decodeSingle(
        {
          src: dataUrl,
          numOfWorkers: 0,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
            multiple: false,
          },
          locate: true,
          locator: { patchSize: 'medium', halfSample: false },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any) => {
          const executionTime = performance.now() - tickStart
          const code = result?.codeResult?.code as string | undefined

          // Adaptive scan rate
          if (executionTime > 180 && currentIntervalRef.current < 350) {
            currentIntervalRef.current = 350
            clearInterval(intervalRef.current!)
            intervalRef.current = setInterval(runTick, currentIntervalRef.current)
          } else if (timeSinceStart > 4000 && !code && currentIntervalRef.current > 120) {
            currentIntervalRef.current = 120
            clearInterval(intervalRef.current!)
            intervalRef.current = setInterval(runTick, currentIntervalRef.current)
          }

          // Confidence filter

          const errors: number[] = (result?.codeResult?.decodedCodes ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any) => c.error as number | undefined)
            .filter((e): e is number => e != null)
          const avgError =
            errors.length > 0
              ? errors.reduce((a: number, b: number) => a + b, 0) / errors.length
              : 1

          if (code && avgError < 0.25 && !detectedRef.current) {
            if (code === lastCodeRef.current) {
              consecutiveRef.current++
            } else {
              lastCodeRef.current = code
              consecutiveRef.current = 1
              dispatch({ type: 'PENDING_CODE', code })
              onPreliminaryDetectRef.current?.(code)
              // Speed up to confirm quickly
              if (currentIntervalRef.current !== 150) {
                currentIntervalRef.current = 150
                clearInterval(intervalRef.current!)
                intervalRef.current = setInterval(runTick, currentIntervalRef.current)
              }
            }

            if (consecutiveRef.current >= 2) {
              detectedRef.current = true
              stopDecoding()
              onDetectedRef.current(code)
            }
          } else if (!code && lastCodeRef.current) {
            lastCodeRef.current = null
            consecutiveRef.current = 0
            dispatch({ type: 'LOST_CODE' })
          }
        }
      )
    }

    intervalRef.current = setInterval(runTick, currentIntervalRef.current)
  }, [stopDecoding])

  useEffect(() => {
    if (!stream) return

    detectedRef.current = false
    lastCodeRef.current = null
    consecutiveRef.current = 0
    brightnessSampleCountRef.current = 0

    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    video.play().catch(() => {})

    // Detect torch support and reset all visual state
    const track = stream.getVideoTracks()[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caps = track ? (track as any).getCapabilities?.() : null
    dispatch({ type: 'RESET', torchSupported: !!caps?.torch })

    // Wait for autofocus to stabilize before scanning
    stabilizeTimerRef.current = setTimeout(() => {
      startDecoding()
    }, 800)

    return () => {
      stopDecoding()
      video.srcObject = null
    }
  }, [stream, startDecoding, stopDecoding])

  if (!stream) return null

  const { pendingCode, isStabilizing, isTooKark, torchOn, torchSupported } = state

  return createPortal(
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">Skanna streckkod</span>
        </div>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={handleTorchToggle}
              className={`p-2 rounded-full transition-colors ${torchOn ? 'bg-yellow-400/30 text-yellow-300' : 'hover:bg-white/20 text-white/70'}`}
              aria-label={torchOn ? 'Stäng av ficklampa' : 'Slå på ficklampa'}
            >
              <Flashlight className="h-5 w-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {/* Stabilizing overlay */}
          {isStabilizing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="text-white text-sm font-medium">Fokuserar kameran...</p>
            </div>
          )}

          {/* Scan guide */}
          {!isStabilizing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`relative w-4/5 h-1/5 rounded-lg transition-colors duration-200 ${
                  pendingCode ? 'border-4 border-yellow-400' : 'border-2 border-white/70'
                }`}
              >
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-white rounded-br" />
              </div>
            </div>
          )}
        </div>

        {/* Status text */}
        <p className="text-white/70 text-sm text-center">
          {isStabilizing
            ? '\u00a0'
            : isTooKark
              ? '⚠️ För mörkt — slå på ficklampan eller gå till bättre ljus'
              : pendingCode
                ? '✓ Bekräftar...'
                : 'Håll streckkoden inom ramen'}
        </p>
      </div>

      {/* Footer */}
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
