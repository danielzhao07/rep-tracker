import { create } from 'zustand'

type CameraPermission = 'granted' | 'denied' | 'prompt'

interface CameraState {
  devices: MediaDeviceInfo[]
  selectedDevice: string | null
  stream: MediaStream | null
  permissions: CameraPermission
  error: string | null

  initializeCamera: (deviceId?: string) => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => Promise<void>
  setError: (error: string | null) => void
}

export const useCameraStore = create<CameraState>((set, get) => ({
  devices: [],
  selectedDevice: null,
  stream: null,
  permissions: 'prompt',
  error: null,

  initializeCamera: async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: 1280, height: 720 }
          : { facingMode: 'user', width: 1280, height: 720 },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')

      set({
        stream,
        devices: videoDevices,
        selectedDevice: deviceId || stream.getVideoTracks()[0]?.getSettings().deviceId || null,
        permissions: 'granted',
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied'
      set({
        permissions: message.includes('denied') ? 'denied' : 'prompt',
        error: message,
      })
    }
  },

  stopCamera: () => {
    const { stream } = get()
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    set({ stream: null })
  },

  switchCamera: async (deviceId: string) => {
    const { stopCamera, initializeCamera } = get()
    stopCamera()
    await initializeCamera(deviceId)
  },

  setError: (error) => set({ error }),
}))
