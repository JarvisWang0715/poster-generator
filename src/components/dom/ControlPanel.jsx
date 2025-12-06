'use client'

import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import usePosterStore from '@/stores/usePosterStore'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const AspectRatioControls = () => {
  const { aspectRatio, setAspectRatio } = usePosterStore()

  return (
    <div className='flex gap-2'>
      <Button
        variant={aspectRatio === '9:16' ? 'default' : 'outline'}
        onClick={() => setAspectRatio('9:16')}
        className='flex-1'
      >
        9:16
      </Button>
      <Button
        variant={aspectRatio === '3:4' ? 'default' : 'outline'}
        onClick={() => setAspectRatio('3:4')}
        className='flex-1'
      >
        3:4
      </Button>
    </div>
  )
}

const TextControls = () => {
  const { text, setText } = usePosterStore()

  return (
    <div className='space-y-3'>
      <Label>Text Content</Label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Enter your text here...&#10;Each line will be rendered separately'
        className='min-h-[120px] resize-none'
      />
      <p className='text-xs text-muted-foreground'>Press Enter for new lines</p>
    </div>
  )
}

const ColorControls = () => {
  const { colors, setColors } = usePosterStore()

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label>Text Color</Label>
        <input
          type='color'
          value={colors.text}
          onChange={(e) => setColors({ text: e.target.value })}
          className='h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5'
        />
      </div>
      <div className='flex items-center justify-between'>
        <Label>Background</Label>
        <input
          type='color'
          value={colors.background}
          onChange={(e) => setColors({ background: e.target.value })}
          className='h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5'
        />
      </div>
    </div>
  )
}

const AnimationControls = () => {
  const { animation, setAnimation, togglePlayback } = usePosterStore()

  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label>Speed</Label>
          <span className='text-sm text-muted-foreground'>{animation.speed.toFixed(1)}</span>
        </div>
        <Slider
          value={[animation.speed]}
          onValueChange={([value]) => setAnimation({ speed: value })}
          min={0.1}
          max={5}
          step={0.1}
        />
      </div>
      <Button
        variant={animation.isPlaying ? 'default' : 'outline'}
        onClick={togglePlayback}
        className='w-full'
      >
        {animation.isPlaying ? 'Pause' : 'Play'}
      </Button>
    </div>
  )
}

const TypographyControls = () => {
  const { typography, setTypography } = usePosterStore()

  return (
    <div className='space-y-5'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label>Font Size</Label>
          <span className='text-sm text-muted-foreground'>{typography.fontSize.toFixed(1)}</span>
        </div>
        <Slider
          value={[typography.fontSize]}
          onValueChange={([value]) => setTypography({ fontSize: value })}
          min={0.1}
          max={3}
          step={0.1}
        />
      </div>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label>Letter Spacing</Label>
          <span className='text-sm text-muted-foreground'>{typography.letterSpacing.toFixed(2)}</span>
        </div>
        <Slider
          value={[typography.letterSpacing]}
          onValueChange={([value]) => setTypography({ letterSpacing: value })}
          min={-0.15}
          max={0.3}
          step={0.01}
        />
      </div>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label>Line Height</Label>
          <span className='text-sm text-muted-foreground'>{typography.lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          value={[typography.lineHeight]}
          onValueChange={([value]) => setTypography({ lineHeight: value })}
          min={0.5}
          max={3}
          step={0.1}
        />
      </div>
    </div>
  )
}

const ExportControls = () => {
  const { requestExport } = usePosterStore()

  return (
    <Button onClick={() => requestExport()} className='w-full'>
      Download PNG
    </Button>
  )
}

const BlobEffectControls = () => {
  const { blobEffect, setBlobEffect, toggleBlobEffect } = usePosterStore()
  const fileInputRef = useRef(null)

  const handleImageUpload = useCallback((e) => {
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
  }, [setBlobEffect])

  const clearImage = useCallback(() => {
    setBlobEffect({
      imageTexture: null,
      imageUrl: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [setBlobEffect])

  return (
    <div className='space-y-4'>
      <Button
        variant={blobEffect.enabled ? 'default' : 'outline'}
        onClick={toggleBlobEffect}
        className='w-full'
      >
        {blobEffect.enabled ? 'Disable Effect' : 'Enable Effect'}
      </Button>

      {blobEffect.enabled && (
        <>
          <div className='space-y-2'>
            <Label>Upload Image</Label>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageUpload}
              className='w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground'
            />
            {blobEffect.imageUrl && (
              <div className='space-y-4'>
                <img
                  src={blobEffect.imageUrl}
                  alt='Uploaded'
                  className='h-20 w-full rounded object-cover'
                />
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label>Exposure</Label>
                    <span className='text-sm text-muted-foreground'>{blobEffect.imageExposure.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[blobEffect.imageExposure]}
                    onValueChange={([value]) => setBlobEffect({ imageExposure: value })}
                    min={-2}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label>Contrast</Label>
                    <span className='text-sm text-muted-foreground'>{blobEffect.imageContrast.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[blobEffect.imageContrast]}
                    onValueChange={([value]) => setBlobEffect({ imageContrast: value })}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label>Pixel Size</Label>
                    <span className='text-sm text-muted-foreground'>{blobEffect.pixelSize.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[blobEffect.pixelSize]}
                    onValueChange={([value]) => setBlobEffect({ pixelSize: value })}
                    min={0.05}
                    max={1}
                    step={0.01}
                  />
                </div>
                <Button variant='outline' size='sm' onClick={clearImage} className='w-full'>
                  Clear Image
                </Button>
              </div>
            )}
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Transition</Label>
              <Button
                variant={blobEffect.mouseControl ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBlobEffect({ mouseControl: !blobEffect.mouseControl })}
              >
                {blobEffect.mouseControl ? 'Mouse' : 'Manual'}
              </Button>
            </div>
            {!blobEffect.mouseControl && (
              <Slider
                value={[blobEffect.transition]}
                onValueChange={([value]) => setBlobEffect({ transition: value })}
                min={0}
                max={1}
                step={0.01}
              />
            )}
            {blobEffect.mouseControl && (
              <p className='text-xs text-muted-foreground'>Move mouse up/down to control transition</p>
            )}
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Blob Size</Label>
              <span className='text-sm text-muted-foreground'>{blobEffect.noiseScale.toFixed(1)}</span>
            </div>
            <Slider
              value={[blobEffect.noiseScale]}
              onValueChange={([value]) => setBlobEffect({ noiseScale: value })}
              min={0.5}
              max={3}
              step={0.1}
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Warp Intensity</Label>
              <span className='text-sm text-muted-foreground'>{blobEffect.warpIntensity.toFixed(1)}</span>
            </div>
            <Slider
              value={[blobEffect.warpIntensity]}
              onValueChange={([value]) => setBlobEffect({ warpIntensity: value })}
              min={0}
              max={5}
              step={0.1}
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Stroke Width</Label>
              <span className='text-sm text-muted-foreground'>{blobEffect.strokeWidth.toFixed(2)}</span>
            </div>
            <Slider
              value={[blobEffect.strokeWidth]}
              onValueChange={([value]) => setBlobEffect({ strokeWidth: value })}
              min={0}
              max={0.2}
              step={0.01}
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Animation Speed</Label>
              <span className='text-sm text-muted-foreground'>{blobEffect.speed.toFixed(1)}</span>
            </div>
            <Slider
              value={[blobEffect.speed]}
              onValueChange={([value]) => setBlobEffect({ speed: value })}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
        </>
      )}
    </div>
  )
}

const ControlPanel = () => {
  const { resetToDefaults } = usePosterStore()

  return (
    <div className='flex h-full flex-col bg-background'>
      <div className='border-b p-4'>
        <h2 className='text-lg font-semibold'>Poster Generator</h2>
      </div>
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-6'>
          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Aspect Ratio</h3>
            <AspectRatioControls />
          </section>

          <Separator />

          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Text</h3>
            <TextControls />
          </section>

          <Separator />

          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Colors</h3>
            <ColorControls />
          </section>

          <Separator />

          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Typography</h3>
            <TypographyControls />
          </section>

          <Separator />

          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Animation</h3>
            <AnimationControls />
          </section>

          <Separator />

          <section>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>Blob Effect</h3>
            <BlobEffectControls />
          </section>

          <Separator />

          <div className='space-y-3'>
            <ExportControls />
            <Button variant='outline' onClick={resetToDefaults} className='w-full'>
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
