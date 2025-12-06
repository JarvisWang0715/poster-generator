'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import usePosterStore from '@/stores/usePosterStore'

const useCanvasExport = () => {
  const { gl, scene, camera, size, viewport } = useThree()
  const { exportRequested, exportOptions, clearExportRequest, aspectRatio, blobEffect, portalRefs, cameraProps } = usePosterStore()
  const exportPendingRef = useRef(false)

  useEffect(() => {
    if (!exportRequested || exportPendingRef.current) return
    exportPendingRef.current = true

    const exportImage = async () => {
      const { format, scale, filename } = exportOptions

      // Fixed export dimensions: 1080x1920 for 9:16, 1080x1440 for 3:4
      const exportWidth = 1080
      const exportHeight = aspectRatio === '9:16' ? 1920 : 1440

      // Store original canvas state
      const originalPixelRatio = gl.getPixelRatio()
      const originalWidth = gl.domElement.clientWidth
      const originalHeight = gl.domElement.clientHeight

      // Find the shader mesh and materials to update
      let posterShaderMesh = null
      let origPosterTexture = null
      const materialsToUpdate = []

      scene.traverse((obj) => {
        if (obj.material && obj.material.uniforms) {
          if (obj.material.uniforms.uPosterTexture) {
            posterShaderMesh = obj
            origPosterTexture = obj.material.uniforms.uPosterTexture.value
          }
          if (obj.material.uniforms.uResolution) {
            materialsToUpdate.push({
              material: obj.material,
              origRes: obj.material.uniforms.uResolution.value.clone(),
            })
          }
        }
      })

      // Create FBO for portal scene at export dimensions
      const exportPosterFBO = new THREE.WebGLRenderTarget(exportWidth, exportHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      })

      // Save and disable scissor test
      const scissorEnabled = gl.getScissorTest()
      gl.setScissorTest(false)

      // Calculate the correct aspect ratio for export (should match export dimensions)
      const exportAspect = exportWidth / exportHeight

      // If we have portal refs, re-render the portal scene at export dimensions
      if (portalRefs.scene && portalRefs.camera && posterShaderMesh) {
        // Create camera with FOV=40 and position z=6 (matching Common component)
        // Use export aspect ratio to match the render target dimensions
        const exportPortalCamera = new THREE.PerspectiveCamera(
          40, // Fixed FOV matching Common component
          exportAspect,
          0.1,
          1000
        )
        exportPortalCamera.position.set(0, 0, 6) // Fixed position matching Common component

        gl.setRenderTarget(exportPosterFBO)
        gl.setViewport(0, 0, exportWidth, exportHeight)
        gl.clear()
        gl.render(portalRefs.scene, exportPortalCamera)
        gl.setRenderTarget(null)

        posterShaderMesh.material.uniforms.uPosterTexture.value = exportPosterFBO.texture
      }

      // Update resolution uniforms for export dimensions
      materialsToUpdate.forEach(({ material }) => {
        material.uniforms.uResolution.value.set(exportWidth, exportHeight)
      })

      // Resize canvas for export
      gl.setPixelRatio(1)
      gl.setSize(exportWidth, exportHeight)

      // Create export camera with fixed properties (FOV=40, z=6, export aspect)
      const exportCamera = new THREE.PerspectiveCamera(
        40,
        exportAspect,
        0.1,
        1000
      )
      exportCamera.position.set(0, 0, 6)

      // Render directly to canvas
      gl.setViewport(0, 0, exportWidth, exportHeight)
      gl.clear()
      gl.render(scene, exportCamera)

      // Get the data URL directly from canvas
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'png' ? undefined : 0.95
      const dataURL = gl.domElement.toDataURL(mimeType, quality)

      // Restore original canvas size
      gl.setPixelRatio(originalPixelRatio)
      gl.setSize(originalWidth, originalHeight)

      // Restore scissor test
      gl.setScissorTest(scissorEnabled)

      // Restore original poster texture and uniforms
      if (posterShaderMesh && origPosterTexture) {
        posterShaderMesh.material.uniforms.uPosterTexture.value = origPosterTexture
      }
      materialsToUpdate.forEach(({ material, origRes }) => {
        material.uniforms.uResolution.value.copy(origRes)
      })

      // Clean up
      exportPosterFBO.dispose()

      // Create download link
      const link = document.createElement('a')
      link.download = `${filename}.${format}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clear the export request
      exportPendingRef.current = false
      clearExportRequest()
    }

    exportImage()
  }, [exportRequested, exportOptions, gl, scene, camera, clearExportRequest, aspectRatio, size, viewport, blobEffect, portalRefs, cameraProps])

  return null
}

// Component wrapper for the hook
export const ExportHandler = () => {
  useCanvasExport()
  return null
}

export default useCanvasExport
