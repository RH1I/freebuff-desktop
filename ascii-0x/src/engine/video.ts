import { GIFEncoder, quantize, applyPalette } from 'gifenc'

export interface VideoState {
  playing: boolean
  duration: number
  time: number
  isCamera: boolean
}

export class VideoManager {
  video: HTMLVideoElement | null = null
  stream: MediaStream | null = null
  recorder: MediaRecorder | null = null
  chunks: Blob[] = []

  async loadFile(file: File): Promise<HTMLVideoElement> {
    this.stopCamera()
    const url = URL.createObjectURL(file)
    return this.attach(url, false)
  }

  async startCamera(): Promise<HTMLVideoElement> {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280 }, audio: false })
    const v = await this.attach(this.stream, true)
    return v
  }

  private async attach(src: string | MediaStream, isCamera: boolean): Promise<HTMLVideoElement> {
    this.stopVideo()
    const v = document.createElement('video')
    v.src = typeof src === 'string' ? src : ''
    if (typeof src !== 'string') v.srcObject = src
    v.muted = true
    v.loop = !isCamera
    v.playsInline = true
    await new Promise<void>((res) => {
      v.onloadeddata = () => res()
    })
    await v.play().catch(() => {})
    this.video = v
    void isCamera
    return v
  }

  stopVideo(): void {
    if (this.video) {
      this.video.pause()
      if (this.video.src) URL.revokeObjectURL(this.video.src)
      this.video = null
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
  }

  state(): VideoState {
    return {
      playing: this.video ? !this.video.paused : false,
      duration: this.video && isFinite(this.video.duration) ? this.video.duration : 0,
      time: this.video ? this.video.currentTime : 0,
      isCamera: !!this.stream,
    }
  }

  toggle(): void {
    if (!this.video) return
    if (this.video.paused) void this.video.play()
    else this.video.pause()
  }

  seek(t: number): void {
    if (this.video && isFinite(this.video.duration)) this.video.currentTime = t
  }

  startRecording(canvas: HTMLCanvasElement, fps = 30): void {
    this.chunks = []
    const stream = canvas.captureStream(fps)
    this.recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start()
  }

  stopRecording(): Promise<void> {
    return new Promise((res) => {
      if (!this.recorder || this.recorder.state === 'inactive') return res()
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ascii0x.webm'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        res()
      }
      this.recorder.stop()
    })
  }

  async recordGif(
    getCanvas: () => HTMLCanvasElement | null,
    maxSeconds = 10,
    fps = 12,
    onProgress?: (p: number) => void,
  ): Promise<void> {
    const gif = GIFEncoder()
    const delay = Math.round(1000 / fps)
    const frames = maxSeconds * fps
    const w = 480
    for (let f = 0; f < frames; f++) {
      const srcCanvas = getCanvas()
      if (!srcCanvas) return
      const h = Math.max(2, Math.round((srcCanvas.height / srcCanvas.width) * w))
      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const sctx = tmp.getContext('2d')
      if (!sctx) return
      sctx.drawImage(srcCanvas, 0, 0, w, h)
      const data = sctx.getImageData(0, 0, w, h).data
      const palette = quantize(data, 128)
      const index = applyPalette(data, palette)
      gif.writeFrame(index, w, h, { palette, delay })
      onProgress?.((f + 1) / frames)
      await new Promise((r) => setTimeout(r, 1000 / fps))
    }
    gif.finish()
    const blob = new Blob([new Uint8Array(gif.bytesView()).buffer as ArrayBuffer], { type: 'image/gif' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ascii0x.gif'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }
}
