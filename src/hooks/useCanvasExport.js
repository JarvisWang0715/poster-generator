'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import usePosterStore from '@/stores/usePosterStore'

const useCanvasExport = () => {
  const { gl, scene, camera } = useThree()
  const { exportRequested, exportOptions, clearExportRequest } = usePosterStore()

  useEffect(() => {
    if (!exportRequested) return

    const exportImage = async () => {
      const { format, scale, filename } = exportOptions

      // Store original size
      const originalWidth = gl.domElement.width
      const originalHeight = gl.domElement.height

      // Scale up for higher resolution
      if (scale !== 1) {
        gl.setSize(originalWidth * scale, originalHeight * scale)
      }

      // Render the scene
      gl.render(scene, camera)

      // Get the data URL
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'png' ? undefined : 0.95
      const dataURL = gl.domElement.toDataURL(mimeType, quality)

      // Restore original size
      if (scale !== 1) {
        gl.setSize(originalWidth, originalHeight)
      }

      // Create download link
      const link = document.createElement('a')
      link.download = `${filename}.${format}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clear the export request
      clearExportRequest()
    }

    exportImage()
  }, [exportRequested, exportOptions, gl, scene, camera, clearExportRequest])

  return null
}

// Component wrapper for the hook
export const ExportHandler = () => {
  useCanvasExport()
  return null
}

export default useCanvasExport
