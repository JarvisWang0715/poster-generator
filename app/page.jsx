'use client'

import dynamic from 'next/dynamic'
import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import usePosterStore from '@/stores/usePosterStore'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ImageUp, SlidersHorizontal, Download, Dices } from 'lucide-react'

// Tooltip component matching Figma design
const PresetTooltip = ({ text, visible }) => {
  if (!visible || !text) return null

  return (
    <div
      className='pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2'
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(27, 27, 27, 1)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          whiteSpace: 'pre',
        }}
      >
        <span
          style={{
            color: 'rgba(255, 255, 255, 1)',
            fontFamily: 'Geist, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '20px',
            textAlign: 'left',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}

// Preset button with tooltip
const PresetButton = ({ preset, index, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Staggered animation delay based on index
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100 + index * 80)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      className='relative'
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.3s cubic-bezier(.215, .61, .355, 1), transform 0.3s cubic-bezier(.215, .61, .355, 1)',
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className='h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-transform hover:scale-105'
        style={{
          boxShadow:
            '0 20px 6px 0 rgba(0, 0, 0, 0.00), 0 13px 5px 0 rgba(0, 0, 0, 0.01), 0 7px 4px 0 rgba(0, 0, 0, 0.03), 0 3px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <img src={preset.url} alt={`Preset ${index + 1}`} className='h-full w-full object-cover' />
      </button>
      <PresetTooltip text={preset.text} visible={isHovered} />
    </div>
  )
}

// Upload button with slide-in animation
const UploadButton = ({ presetCount, onClick }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100 + presetCount * 80)
    return () => clearTimeout(timer)
  }, [presetCount])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.3s cubic-bezier(.215, .61, .355, 1), transform 0.3s cubic-bezier(.215, .61, .355, 1)',
      }}
    >
      <button
        onClick={onClick}
        className='flex h-20 w-20 items-center justify-center rounded-2xl border-dashed bg-transparent transition-colors'
        style={{ borderWidth: '1px', borderColor: 'rgba(0, 0, 0, 0.2)', color: 'rgba(0, 0, 0, 0.8)' }}
      >
        <ImageUp className='h-6 w-6' />
      </button>
    </div>
  )
}

// Right side buttons with fade-in animation
const RightSideButtons = ({ onExport, onRandomize }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className='fixed top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2'
      style={{
        left: 'calc(50% + (100vh - 12rem) * 9 / 16 / 2 + 16px)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(20px)',
        transition: 'opacity 0.3s cubic-bezier(.215, .61, .355, 1), transform 0.3s cubic-bezier(.215, .61, .355, 1)',
      }}
    >
      <button
        onClick={onExport}
        className='flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-50'
        style={{
          color: 'rgba(0, 0, 0, 0.8)',
          boxShadow:
            '0 20px 6px 0 rgba(0, 0, 0, 0.00), 0 13px 5px 0 rgba(0, 0, 0, 0.01), 0 7px 4px 0 rgba(0, 0, 0, 0.03), 0 3px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <Download className='h-5 w-5' />
      </button>
      <button
        onClick={onRandomize}
        className='flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-50'
        style={{
          color: 'rgba(0, 0, 0, 0.8)',
          boxShadow:
            '0 20px 6px 0 rgba(0, 0, 0, 0.00), 0 13px 5px 0 rgba(0, 0, 0, 0.01), 0 7px 4px 0 rgba(0, 0, 0, 0.03), 0 3px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <Dices className='h-5 w-5' />
      </button>
    </div>
  )
}

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center'>
      <svg className='h-8 w-8 animate-spin text-gray-400' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})

const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const PosterWithEffect = dynamic(() => import('@/components/canvas/PosterWithEffect'), { ssr: false })
const ExportHandler = dynamic(() => import('@/hooks/useCanvasExport').then((mod) => mod.ExportHandler), { ssr: false })
const ControlPanel = dynamic(() => import('@/components/dom/ControlPanel'), { ssr: false })

const PosterCanvas = () => {
  const { aspectRatio } = usePosterStore()
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[3/4]'

  return (
    <div
      className={`relative ${aspectClass}`}
      style={{
        height: 'calc(100vh - 12rem)',
        maxHeight: '100%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 0 1px 0 rgba(0, 0, 0, 0.50)',
      }}
    >
      <View className='absolute inset-0'>
        <Suspense fallback={null}>
          <PosterWithEffect />
          <Common color='#0a0a0a' />
          <ExportHandler />
        </Suspense>
      </View>
    </div>
  )
}

const FloatingInputBar = () => {
  const { text, setText, requestExport, setBlobEffect, blobEffect } = usePosterStore()
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [presets, setPresets] = useState([])

  // Fetch presets on mount
  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => setPresets(data.presets || []))
      .catch(err => console.error('Error fetching presets:', err))
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [text])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const texture = new THREE.Texture(img)
        texture.needsUpdate = true
        setBlobEffect({
          imageTexture: texture,
          imageUrl: event.target.result,
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const loadPresetImage = (url, presetText) => {
    const img = new Image()
    img.onload = () => {
      const texture = new THREE.Texture(img)
      texture.needsUpdate = true
      setBlobEffect({
        imageTexture: texture,
        imageUrl: url,
        seed: Math.random() * 100,
      })
      if (presetText) {
        setText(presetText)
      }
    }
    img.src = url
  }

  return (
    <>
      {/* Left side - Stacked preset images and upload (center left with 24px padding) */}
      <div className='fixed left-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2'>
        {/* Dynamic preset images */}
        {presets.map((preset, index) => (
          <PresetButton
            key={preset.url}
            preset={preset}
            index={index}
            onClick={() => loadPresetImage(preset.url, preset.text)}
          />
        ))}

        {/* Upload button */}
        <UploadButton presetCount={presets.length} fileInputRef={fileInputRef} onClick={() => fileInputRef.current?.click()} />
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleImageUpload}
          className='hidden'
        />
      </div>

      {/* Bottom center - Input bar with settings inside */}
      <div className='fixed bottom-12 left-1/2 z-50 -translate-x-1/2'>
        <div className='flex items-end gap-4 border border-neutral-200 bg-white shadow-lg' style={{ borderRadius: '24px', width: 'calc((100vh - 12rem) * 9 / 16)' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Type something...'
            rows={1}
            className='scrollbar-hide flex-1 resize-none bg-transparent outline-none placeholder:text-neutral-400'
            style={{ fontSize: '14pt', lineHeight: '150%', fontFamily: 'Geist, sans-serif', padding: '16px 20px', maxHeight: '200px', overflow: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          />
          {/* Settings button inside input */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className='mr-3 mb-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-neutral-100'
                style={{ color: 'rgba(0, 0, 0, 0.8)' }}
              >
                <SlidersHorizontal className='h-5 w-5' />
              </button>
            </SheetTrigger>
            <SheetContent side='right' className='w-80 overflow-y-auto p-0'>
              <Suspense fallback={<div className='flex h-full items-center justify-center'>Loading...</div>}>
                <ControlPanel />
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Right side - Export and Randomize buttons (positioned next to canvas) */}
      <RightSideButtons onExport={() => requestExport()} onRandomize={() => setBlobEffect({ seed: Math.random() * 100 })} />
    </>
  )
}

// Toast notification component
const Toast = ({ message, visible, onHide }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onHide])

  return (
    <div
      className='fixed bottom-32 left-1/2 z-50 -translate-x-1/2'
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className='rounded-full px-4 py-2 text-sm text-white'
        style={{ backgroundColor: 'rgba(27, 27, 27, 0.9)' }}
      >
        {message}
      </div>
    </div>
  )
}

export default function Page() {
  const { setBlobEffect } = usePosterStore()
  const [showToast, setShowToast] = useState(true)

  useEffect(() => {
    // Randomize seed on page load
    setBlobEffect({ seed: Math.random() * 100 })
  }, [setBlobEffect])

  return (
    <div className='relative h-screen w-full' style={{ backgroundColor: '#FDFDFD' }}>
      {/* Centered Canvas */}
      <div className='flex h-full items-center justify-center pb-32'>
        <PosterCanvas />
      </div>

      {/* Floating Input Bar */}
      <FloatingInputBar />

      {/* Toast notification */}
      <Toast
        message='Click on canvas to toggle transition'
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </div>
  )
}
