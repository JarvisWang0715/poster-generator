'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { useFBO, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import usePosterStore from '@/stores/usePosterStore'
import PosterText, { PosterBackground } from './PosterText'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uPosterTexture;
  uniform sampler2D uImageTexture;
  uniform float uThreshold;
  uniform float uStrokeWidth;
  uniform float uNoiseScale;
  uniform float uWarpIntensity;
  uniform bool uHasImage;
  uniform vec3 uStrokeColor;
  uniform vec3 uMaskColor;
  uniform float uTransition;

  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Smooth FBM with fewer octaves for large organic shapes
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.6;
    float frequency = 1.0;
    // Only 3 octaves for smoother, larger shapes
    for (int i = 0; i < 3; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  // Domain warping for organic blob shapes
  float warpedNoise(vec2 p, float time) {
    // First warp layer
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + 0.05 * time),
      fbm(p + vec2(5.2, 1.3) + 0.05 * time)
    );

    // Second warp layer with controlled intensity
    vec2 r = vec2(
      fbm(p + uWarpIntensity * q + vec2(1.7, 9.2)),
      fbm(p + uWarpIntensity * q + vec2(8.3, 2.8))
    );

    return fbm(p + uWarpIntensity * 0.5 * r);
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    // Scale for large organic blobs
    vec2 p = uv * aspect * uNoiseScale;

    float n = warpedNoise(p, uTime);

    // Threshold controls how much of the mask is visible
    float adjustedThreshold = uThreshold + (uTransition - 0.5) * 1.5;

    // Hard edge mask - blob areas vs text areas
    float mask = step(adjustedThreshold, n);

    // Stroke: detect edges using gradient
    float eps = 0.01;
    float nx = warpedNoise(p + vec2(eps, 0.0), uTime);
    float ny = warpedNoise(p + vec2(0.0, eps), uTime);
    float edge = length(vec2(nx - n, ny - n)) / eps;

    // Stroke only at the transition boundary
    float nearEdge = 1.0 - smoothstep(0.0, uStrokeWidth * 2.0, abs(n - adjustedThreshold));
    float stroke = nearEdge * smoothstep(0.5, 2.0, edge);

    // Sample textures
    vec4 posterColor = texture2D(uPosterTexture, uv);
    vec4 maskLayerColor = uHasImage ? texture2D(uImageTexture, uv) : vec4(uMaskColor, 1.0);

    // Blend: mask=1 shows mask layer (white/image), mask=0 shows poster (text)
    vec3 color = mix(posterColor.rgb, maskLayerColor.rgb, mask);

    // Apply stroke on top
    color = mix(color, uStrokeColor, stroke * 0.95);

    gl_FragColor = vec4(color, 1.0);
  }
`

const PosterWithEffect = () => {
  const meshRef = useRef()
  const portalCameraRef = useRef()
  const { viewport, size, gl, camera } = useThree()
  const { blobEffect, colors } = usePosterStore()

  // Create a scene for the poster
  const portalScene = useMemo(() => new THREE.Scene(), [])

  // Create render target for poster
  const posterTarget = useFBO(size.width * 2, size.height * 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uPosterTexture: { value: null },
    uImageTexture: { value: null },
    uThreshold: { value: 0.0 },
    uStrokeWidth: { value: 0.08 },
    uNoiseScale: { value: 1.2 },
    uWarpIntensity: { value: 2.5 },
    uHasImage: { value: false },
    uStrokeColor: { value: new THREE.Color('#000000') },
    uMaskColor: { value: new THREE.Color('#ffffff') },
    uTransition: { value: 0.5 },
  }), [])

  useFrame((state, delta) => {
    if (!blobEffect.enabled) return

    // Render poster to texture
    gl.setRenderTarget(posterTarget)
    gl.render(portalScene, camera)
    gl.setRenderTarget(null)

    // Update shader uniforms
    if (meshRef.current) {
      const mat = meshRef.current.material
      mat.uniforms.uTime.value += delta * (blobEffect.speed || 0.5)
      mat.uniforms.uResolution.value.set(size.width, size.height)
      mat.uniforms.uPosterTexture.value = posterTarget.texture
      mat.uniforms.uThreshold.value = blobEffect.threshold || 0.0
      mat.uniforms.uStrokeWidth.value = blobEffect.strokeWidth || 0.05
      mat.uniforms.uNoiseScale.value = blobEffect.noiseScale || 3.0
      mat.uniforms.uWarpIntensity.value = blobEffect.warpIntensity || 4.0
      mat.uniforms.uTransition.value = blobEffect.transition ?? 0.5

      if (blobEffect.imageTexture) {
        mat.uniforms.uImageTexture.value = blobEffect.imageTexture
        mat.uniforms.uHasImage.value = true
      } else {
        mat.uniforms.uHasImage.value = false
      }
    }
  })

  if (!blobEffect.enabled) {
    // Render poster directly without effect
    return (
      <>
        <PosterBackground />
        <PosterText />
      </>
    )
  }

  return (
    <>
      {/* Render poster content to portal scene */}
      {createPortal(
        <>
          <PosterBackground />
          <PosterText />
        </>,
        portalScene
      )}

      {/* Background for the effect */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color={colors.background} />
      </mesh>

      {/* Blob effect shader overlay */}
      <mesh ref={meshRef} position={[0, 0, 0.5]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>
    </>
  )
}

export default PosterWithEffect
