import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { CapturedPhoto } from '../types'
import { CameraIcon, UploadIcon } from './icons'

const MAX_EDGE = 1280
const THUMB_EDGE = 200

function drawScaled(source: CanvasImageSource, w: number, h: number, maxEdge: number): string {
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function toCaptured(source: CanvasImageSource, w: number, h: number): CapturedPhoto {
  const dataUrl = drawScaled(source, w, h, MAX_EDGE)
  return {
    base64: dataUrl.split(',')[1],
    mimeType: 'image/jpeg',
    dataUrl,
    thumbnail: drawScaled(source, w, h, THUMB_EDGE),
  }
}

async function fileToCaptured(file: File): Promise<CapturedPhoto> {
  const bitmap = await createImageBitmap(file)
  try {
    return toCaptured(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

export default function PhotoInput({ onPhoto }: { onPhoto: (p: CapturedPhoto) => void }) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'camera' | 'upload'>('camera')
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const selectMode = (m: 'camera' | 'upload') => {
    if (m !== 'camera') {
      stopTracks()
      setLive(false)
    }
    setMode(m)
  }

  useEffect(() => {
    if (mode !== 'camera') return
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        audio: false,
      })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setLive(true)
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('photo.camErr'))
          setMode('upload')
        }
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [mode, t])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    onPhoto(toCaptured(video, video.videoWidth, video.videoHeight))
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      onPhoto(await fileToCaptured(file))
    } catch {
      setError(t('photo.camErr'))
    }
  }

  return (
    <div className="photo-input">
      <div className="segmented">
        <button
          type="button"
          className={mode === 'camera' ? 'active' : ''}
          onClick={() => selectMode('camera')}
        >
          <CameraIcon /> {t('photo.camera')}
        </button>
        <button
          type="button"
          className={mode === 'upload' ? 'active' : ''}
          onClick={() => selectMode('upload')}
        >
          <UploadIcon /> {t('photo.upload')}
        </button>
      </div>

      {error && <div className="notice warn">{error}</div>}

      {mode === 'camera' ? (
        <div className="viewfinder">
          <video ref={videoRef} playsInline muted autoPlay />
          {!live && <div className="viewfinder-msg">{t('photo.starting')}</div>}
          {live && (
            <button type="button" className="shutter" onClick={capture} aria-label={t('photo.camera')}>
              <span />
            </button>
          )}
        </div>
      ) : (
        <button type="button" className="dropzone" onClick={() => fileRef.current?.click()}>
          <UploadIcon width={34} height={34} />
          <strong>{t('photo.tap')}</strong>
          <small>{t('photo.hint')}</small>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
