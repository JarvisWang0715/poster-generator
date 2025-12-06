import { create } from 'zustand'

const usePosterStore = create((set, get) => ({
  // Text content - single string, split by newlines
  text: 'This is the default text',

  // Poster settings
  aspectRatio: '9:16', // 9:16 (vertical 16:9) or 3:4 (vertical 4:3)

  // Computed: get lines array from text
  getLines: () => {
    const text = get().text
    return text.split('\n').filter((line) => line.length > 0)
  },

  // Typography settings
  typography: {
    fontSize: 0.4,
    letterSpacing: -0.05,
    lineHeight: 1.0,
  },

  // Colors
  colors: {
    text: '#000000',
    background: '#ffffff',
    accent: '#ff6b6b',
  },

  // Layout
  layout: {
    alignment: 'center',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  },

  // Animation
  animation: {
    speed: 2.0,
    isPlaying: false,
  },

  // Blob Effect
  blobEffect: {
    enabled: false,
    threshold: 0.0,
    strokeWidth: 0.04,
    noiseScale: 0.5,
    warpIntensity: 0.7,
    speed: 0.0,
    transition: 0.53,
    imageTexture: null,
    imageUrl: null,
    imageExposure: 0.2,
    imageContrast: 1.5,
    pixelSize: 0.78,
    mouseControl: true,
  },

  // Export
  exportRequested: false,
  exportOptions: {
    format: 'png',
    scale: 2,
    filename: 'kinetic-poster',
  },

  // Actions
  setText: (text) => set({ text }),

  setAspectRatio: (aspectRatio) => set({ aspectRatio }),

  setTypography: (updates) =>
    set((state) => ({
      typography: { ...state.typography, ...updates },
    })),

  setColors: (updates) =>
    set((state) => ({
      colors: { ...state.colors, ...updates },
    })),

  setLayout: (updates) =>
    set((state) => ({
      layout: { ...state.layout, ...updates },
    })),

  setLayoutPosition: (axis, value) =>
    set((state) => ({
      layout: {
        ...state.layout,
        position: { ...state.layout.position, [axis]: value },
      },
    })),

  setLayoutRotation: (axis, value) =>
    set((state) => ({
      layout: {
        ...state.layout,
        rotation: { ...state.layout.rotation, [axis]: value },
      },
    })),

  setAnimation: (updates) =>
    set((state) => ({
      animation: { ...state.animation, ...updates },
    })),

  togglePlayback: () =>
    set((state) => ({
      animation: { ...state.animation, isPlaying: !state.animation.isPlaying },
    })),

  setBlobEffect: (updates) =>
    set((state) => ({
      blobEffect: { ...state.blobEffect, ...updates },
    })),

  toggleBlobEffect: () =>
    set((state) => ({
      blobEffect: { ...state.blobEffect, enabled: !state.blobEffect.enabled },
    })),

  requestExport: (options = {}) =>
    set((state) => ({
      exportRequested: true,
      exportOptions: { ...state.exportOptions, ...options },
    })),

  clearExportRequest: () => set({ exportRequested: false }),

  resetToDefaults: () =>
    set({
      text: 'This is the default text',
      aspectRatio: '9:16',
      typography: { fontSize: 0.4, letterSpacing: -0.05, lineHeight: 1.0 },
      colors: { text: '#000000', background: '#ffffff', accent: '#ff6b6b' },
      layout: { alignment: 'center', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1 },
    }),
}))

export default usePosterStore
