'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import usePosterStore from '@/stores/usePosterStore'

// Main poster text component - renders all text with auto-wrap and looping scroll
const PosterText = () => {
  const { text, typography, colors, aspectRatio, animation } = usePosterStore()
  const groupRef = useRef()
  const [textHeight, setTextHeight] = useState(1)

  // Visible height based on camera setup (fov=40, z=6)
  const visibleHeight = 4.37

  // Calculate maxWidth based on aspect ratio and camera setup
  const maxWidth = useMemo(() => {
    if (aspectRatio === '9:16') {
      return visibleHeight * (9 / 16) * 0.94
    } else {
      return visibleHeight * (3 / 4) * 0.94
    }
  }, [aspectRatio])

  // Measure text height when it syncs
  const handleSync = useCallback((troika) => {
    if (troika.textRenderInfo) {
      const height = troika.textRenderInfo.blockBounds[3] - troika.textRenderInfo.blockBounds[1]
      setTextHeight(Math.max(height, 0.5))
    }
  }, [])

  // Gap between repeated text blocks
  const gap = visibleHeight * 0.3
  // Total loop distance (text height + gap)
  const loopDistance = textHeight + gap

  // Animation: scroll from top to bottom, looping seamlessly
  useFrame((state) => {
    if (groupRef.current && animation.isPlaying) {
      const time = state.clock.elapsedTime
      const speed = animation.speed

      // Calculate offset using modulo for seamless loop
      // As offset increases, text moves DOWN (y decreases)
      const offset = (time * speed) % loopDistance

      // Move group down by offset amount
      groupRef.current.position.y = -offset
    }
  })

  // Create multiple copies stacked ABOVE each other for seamless scroll
  // As the group moves down, upper copies come into view from top
  const copies = useMemo(() => {
    // Need enough copies to cover visible area + one extra for seamless loop
    const numCopies = Math.ceil(visibleHeight / loopDistance) + 3
    return Array.from({ length: numCopies }, (_, i) => i)
  }, [visibleHeight, loopDistance])

  // Start position: first copy at top of screen
  const startY = visibleHeight / 2

  return (
    <group ref={groupRef}>
      {copies.map((i) => (
        <Text
          key={i}
          font='/fonts/Geist-Regular.ttf'
          fontSize={typography.fontSize}
          letterSpacing={typography.letterSpacing}
          lineHeight={typography.lineHeight}
          color={colors.text}
          anchorX='center'
          anchorY='top'
          position={[0, startY - i * loopDistance, 0]}
          maxWidth={maxWidth}
          textAlign='center'
          overflowWrap='break-word'
          onSync={i === 0 ? handleSync : undefined}
        >
          {text}
        </Text>
      ))}
    </group>
  )
}

// Background plane
export const PosterBackground = () => {
  const { colors } = usePosterStore()

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color={colors.background} />
    </mesh>
  )
}

export default PosterText
