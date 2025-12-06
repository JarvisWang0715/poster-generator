'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import usePosterStore from '@/stores/usePosterStore'

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

const PosterPreview = () => {
  const { aspectRatio } = usePosterStore()

  // Convert aspect ratio string to CSS aspect ratio
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[3/4]'

  return (
    <div className='flex h-full items-center justify-center bg-neutral-100 p-6'>
      <div
        className={`relative ${aspectClass} border border-neutral-300 bg-white shadow-sm`}
        style={{
          height: 'calc(100vh - 3rem)',
          maxHeight: '100%',
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
    </div>
  )
}

export default function PosterPage() {
  return (
    <div className='flex h-screen w-full'>
      {/* Control Panel - Left Side */}
      <div className='w-80 flex-shrink-0 border-r'>
        <Suspense fallback={<div className='flex h-full items-center justify-center text-sm text-muted-foreground'>control panel</div>}>
          <ControlPanel />
        </Suspense>
      </div>

      {/* 3D Preview - Right Side */}
      <div className='flex-1'>
        <PosterPreview />
      </div>
    </div>
  )
}
