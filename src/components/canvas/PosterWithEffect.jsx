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
  uniform vec2 uMouse;
  uniform bool uMouseControl;
  uniform float uHalftoneSize;
  uniform float uImageExposure;
  uniform float uImageContrast;

  varying vec2 vUv;

  // Exposure and contrast adjustment
  vec3 adjustExposureContrast(vec3 color, float exposure, float contrast) {
    // Exposure (multiply)
    color *= pow(2.0, exposure);
    // Contrast (pivot around 0.5)
    color = (color - 0.5) * contrast + 0.5;
    return clamp(color, 0.0, 1.0);
  }

  // Bayer dithering matrix
  float Bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
  }

  #define Bayer4(a)   (Bayer2 (0.5 * (a)) * 0.25 + Bayer2(a))
  #define Bayer8(a)   (Bayer4 (0.5 * (a)) * 0.25 + Bayer2(a))
  #define Bayer16(a)  (Bayer8 (0.5 * (a)) * 0.25 + Bayer2(a))
  #define Bayer32(a)  (Bayer16(0.5 * (a)) * 0.25 + Bayer2(a))
  #define Bayer64(a)  (Bayer32(0.5 * (a)) * 0.25 + Bayer2(a))

  // Halftone effect with Bayer dithering
  vec3 halftone(sampler2D tex, vec2 uv, float scale, float exposure, float contrast) {
    vec2 fragCoord = uv * uResolution;

    // Bayer dithering threshold
    float dithering = Bayer64(fragCoord * scale) - 0.5;

    // Sample and adjust image
    vec3 color = texture2D(tex, uv).rgb;
    color = adjustExposureContrast(color, exposure, contrast);
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));

    // Apply dithering threshold
    float result = step(0.5, brightness + dithering);
    return vec3(result);
  }

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

    // Use mouse position for transition if enabled, otherwise use slider value
    float transition = uMouseControl ? uMouse.y : uTransition;

    // Threshold controls how much of the mask is visible
    float adjustedThreshold = uThreshold + (transition - 0.5) * 1.5;

    // Hard edge mask - blob areas vs text areas
    float mask = step(adjustedThreshold, n);

    // Burnt edge effect - use high frequency noise at the boundary
    float edgeDist = abs(n - adjustedThreshold);

    // Add high-freq noise for burnt/rough edge texture
    float burntNoise = snoise(p * 15.0 + uTime * 0.5) * 0.5 + 0.5;
    float burntNoise2 = snoise(p * 30.0 - uTime * 0.3) * 0.5 + 0.5;
    float combinedBurnt = burntNoise * burntNoise2;

    // Stroke width varies based on burnt noise
    float strokeEdge = uStrokeWidth * (0.5 + combinedBurnt * 1.5);

    // Sharp burnt stroke at edge
    float inStroke = step(edgeDist, strokeEdge);
    float burntIntensity = inStroke * (1.0 - smoothstep(0.0, strokeEdge, edgeDist));

    // Add texture variation to the stroke
    burntIntensity *= (0.7 + combinedBurnt * 0.3);

    // Sample textures
    vec4 posterColor = texture2D(uPosterTexture, uv);

    // Apply halftone effect to uploaded image
    vec4 maskLayerColor;
    if (uHasImage) {
      vec3 halftoneImg = halftone(uImageTexture, uv, uHalftoneSize, uImageExposure, uImageContrast);
      maskLayerColor = vec4(halftoneImg, 1.0);
    } else {
      maskLayerColor = vec4(uMaskColor, 1.0);
    }

    // Blend: mask=1 shows mask layer (white/image), mask=0 shows poster (text)
    vec3 color = mix(posterColor.rgb, maskLayerColor.rgb, mask);

    // Apply burnt stroke on top
    color = mix(color, uStrokeColor, burntIntensity * 0.95);

    gl_FragColor = vec4(color, 1.0);
  }
`

const PosterWithEffect = () => {
  const meshRef = useRef()
  const { viewport, size, gl, camera } = useThree()
  const { blobEffect, colors, aspectRatio } = usePosterStore()

  // Create a scene for the poster
  const portalScene = useMemo(() => new THREE.Scene(), [])

  // Create a camera that matches the poster aspect ratio
  const portalCamera = useMemo(() => {
    const cam = camera.clone()
    return cam
  }, [camera])

  // Create render target for poster - use viewport dimensions for correct aspect
  const posterTarget = useFBO(Math.floor(viewport.width * 200), Math.floor(viewport.height * 200), {
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
    uStrokeWidth: { value: 0.04 },
    uNoiseScale: { value: 1.0 },
    uWarpIntensity: { value: 1.3 },
    uHasImage: { value: false },
    uStrokeColor: { value: new THREE.Color('#000000') },
    uMaskColor: { value: new THREE.Color('#ffffff') },
    uTransition: { value: 0.74 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseControl: { value: false },
    uHalftoneSize: { value: 0.25 },
    uImageExposure: { value: 0.0 },
    uImageContrast: { value: 1.0 },
  }), [])

  useFrame((state, delta) => {
    if (!blobEffect.enabled) return

    // Update portal camera to match main camera
    portalCamera.position.copy(camera.position)
    portalCamera.rotation.copy(camera.rotation)
    portalCamera.updateProjectionMatrix()

    // Render poster to texture
    gl.setRenderTarget(posterTarget)
    gl.render(portalScene, portalCamera)
    gl.setRenderTarget(null)

    // Update shader uniforms
    if (meshRef.current) {
      const mat = meshRef.current.material
      mat.uniforms.uTime.value += delta * (blobEffect.speed ?? 0.5)
      mat.uniforms.uResolution.value.set(size.width, size.height)
      mat.uniforms.uPosterTexture.value = posterTarget.texture
      mat.uniforms.uThreshold.value = blobEffect.threshold ?? 0.0
      mat.uniforms.uStrokeWidth.value = blobEffect.strokeWidth ?? 0.05
      mat.uniforms.uNoiseScale.value = blobEffect.noiseScale ?? 3.0
      mat.uniforms.uWarpIntensity.value = blobEffect.warpIntensity ?? 4.0
      mat.uniforms.uTransition.value = blobEffect.transition ?? 0.5
      mat.uniforms.uMouseControl.value = blobEffect.mouseControl ?? false

      // Update mouse position (normalized 0-1)
      if (blobEffect.mouseControl) {
        const pointer = state.pointer
        // Convert from -1,1 to 0,1 range
        mat.uniforms.uMouse.value.set(
          (pointer.x + 1) * 0.5,
          (pointer.y + 1) * 0.5
        )
      }

      if (blobEffect.imageTexture) {
        mat.uniforms.uImageTexture.value = blobEffect.imageTexture
        mat.uniforms.uHasImage.value = true
        mat.uniforms.uImageExposure.value = blobEffect.imageExposure ?? 0.0
        mat.uniforms.uImageContrast.value = blobEffect.imageContrast ?? 1.0
        mat.uniforms.uHalftoneSize.value = blobEffect.pixelSize ?? 0.25
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
