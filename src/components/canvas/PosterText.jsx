'use client'

import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import usePosterStore from '@/stores/usePosterStore'

// ============================================
// SCALE-TO-FIT MODE COMPONENTS
// ============================================

// Single line component that scales to fit width
const JustifiedLine = ({ text, font, fontSize, letterSpacing, color, maxWidth, y, onMeasured, index }) => {
  const textRef = useRef()
  const [scale, setScale] = useState(1)

  const handleSync = useCallback((troika) => {
    if (troika.textRenderInfo) {
      const textWidth = troika.textRenderInfo.blockBounds[2] - troika.textRenderInfo.blockBounds[0]
      const textHeight = troika.textRenderInfo.blockBounds[3] - troika.textRenderInfo.blockBounds[1]
      if (textWidth > 0) {
        const newScale = maxWidth / textWidth
        setScale(newScale)
      }
      if (onMeasured) {
        onMeasured(index, textHeight)
      }
    }
  }, [maxWidth, onMeasured, index])

  return (
    <Text
      ref={textRef}
      font={font}
      fontSize={fontSize}
      letterSpacing={letterSpacing}
      color={color}
      anchorX='left'
      anchorY='top'
      position={[-maxWidth / 2, y, 0]}
      scale={[scale, 1, 1]}
      onSync={handleSync}
    >
      {text}
    </Text>
  )
}

// Text block component for scale-to-fit mode
const ScaleToFitTextBlock = ({ lines, typography, colors, maxWidth, offsetY, blockIndex = 0 }) => {
  const lineHeight = typography.fontSize * (typography.lineHeight + 0.2) // Add extra spacing
  // Offset even blocks horizontally
  const horizontalOffset = blockIndex % 2 === 1 ? maxWidth * 0.15 : 0

  return (
    <group position={[horizontalOffset, offsetY, 0]}>
      {lines.map((line, index) => (
        <JustifiedLine
          key={index}
          index={index}
          text={line}
          font={typography.font}
          fontSize={typography.fontSize}
          letterSpacing={typography.letterSpacing}
          color={colors.text}
          maxWidth={maxWidth}
          y={-index * lineHeight}
        />
      ))}
    </group>
  )
}

// ============================================
// AUTO-WRAP MODE COMPONENT
// ============================================

const AutoWrapTextBlock = ({ text, typography, colors, maxWidth, offsetY, onMeasured, blockIndex }) => {
  const handleSync = useCallback((troika) => {
    if (troika.textRenderInfo && onMeasured) {
      const height = troika.textRenderInfo.blockBounds[3] - troika.textRenderInfo.blockBounds[1]
      onMeasured(blockIndex, Math.max(height, 0.5))
    }
  }, [onMeasured, blockIndex])

  return (
    <Text
      font={typography.font}
      fontSize={typography.fontSize}
      letterSpacing={typography.letterSpacing}
      lineHeight={typography.lineHeight}
      color={colors.text}
      anchorX='left'
      anchorY='top'
      position={[-maxWidth / 2, offsetY, 0]}
      maxWidth={maxWidth}
      textAlign='justify'
      overflowWrap='break-word'
      onSync={handleSync}
    >
      {text.toUpperCase()}
    </Text>
  )
}

// ============================================
// MAIN POSTER TEXT COMPONENT
// ============================================

const PosterText = () => {
  const { text, typography, colors, aspectRatio, animation } = usePosterStore()
  const groupRef = useRef()
  const [blockHeight, setBlockHeight] = useState(1)

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

  // Split text into lines for scale-to-fit mode
  const lines = useMemo(() => {
    const upperText = text.toUpperCase()
    const splitLines = upperText.split('\n').filter(line => line.trim().length > 0)
    return splitLines.length > 0 ? splitLines : [upperText]
  }, [text])

  // Calculate block height for scale-to-fit
  const calculatedBlockHeight = useMemo(() => {
    const lineHeight = typography.fontSize * (typography.lineHeight + 0.2)
    return lines.length * lineHeight
  }, [lines.length, typography.fontSize, typography.lineHeight])

  // Use calculated height for scale-to-fit, measured for auto-wrap
  const isScaleToFit = typography.textMode === 'scale-to-fit'
  const effectiveBlockHeight = isScaleToFit ? calculatedBlockHeight : blockHeight

  // Gap between repeated text blocks - use blockGap multiplier from animation settings
  const lineHeightValue = typography.fontSize * (typography.lineHeight + 0.2)
  const gap = lineHeightValue * (animation.blockGap ?? 1.0)
  // Total loop distance
  const loopDistance = effectiveBlockHeight + gap

  // Animation offset
  const [animOffset, setAnimOffset] = useState(0)

  useFrame((state) => {
    if (groupRef.current && animation.isPlaying) {
      const time = state.clock.elapsedTime
      const speed = animation.speed
      const offset = (time * speed) % loopDistance
      setAnimOffset(offset)
    }
  })

  // Calculate how many copies we need above and below
  const numCopies = useMemo(() => {
    // Need enough to cover visible area plus some extra for smooth scrolling
    return Math.ceil(visibleHeight / loopDistance) + 2
  }, [visibleHeight, loopDistance])

  const handleBlockMeasured = useCallback((index, height) => {
    if (index === 0) {
      setBlockHeight(Math.max(height, 0.5))
    }
  }, [])

  // Position blocks: center the main one, repeat above and below
  const blockPositions = useMemo(() => {
    const positions = []
    const halfVisible = visibleHeight / 2
    const startOffset = halfVisible // Start from top

    for (let i = 0; i < numCopies; i++) {
      positions.push(startOffset - i * loopDistance)
    }
    return positions
  }, [numCopies, loopDistance, visibleHeight])

  return (
    <group ref={groupRef}>
      {blockPositions.map((baseY, i) => {
        const y = baseY - animOffset
        return isScaleToFit ? (
          <ScaleToFitTextBlock
            key={i}
            blockIndex={i}
            lines={lines}
            typography={typography}
            colors={colors}
            maxWidth={maxWidth}
            offsetY={y}
          />
        ) : (
          <AutoWrapTextBlock
            key={i}
            blockIndex={i}
            text={text}
            typography={typography}
            colors={colors}
            maxWidth={maxWidth}
            offsetY={y}
            onMeasured={i === 0 ? handleBlockMeasured : undefined}
          />
        )
      })}
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
