# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Three Next is a minimalist, high-performance starter for Next.js 14 with React Three Fiber and Three.js. The key feature is seamless navigation between pages with dynamic DOM and 3D canvas content without reloading or recreating the canvas.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # ESLint with auto-fix on app directory
npm run analyze  # Build with bundle analysis (ANALYZE=true)
```

## Architecture

### Persistent Canvas with Tunnel-Rat Portals

The core architectural pattern uses `tunnel-rat` to create portals between DOM and Three.js contexts:

- Canvas persists at root level in `src/components/dom/Layout.jsx` and doesn't unmount on route changes
- `r3f.In` (from `src/helpers/global.js`) wraps 3D content anywhere in the DOM
- `r3f.Out` renders that content in the persistent canvas
- This enables 3D components to appear anywhere while sharing a single canvas

### Component Organization

- `src/components/canvas/` - React Three Fiber 3D components
- `src/components/dom/` - Regular React DOM components
- `src/templates/` - Reusable patterns (smooth scrolling, shaders, post-processing)
- `src/helpers/` - Tunnel-rat setup and utility wrappers

### View Component Pattern

`View.jsx` enables multiple independent 3D viewports on one canvas:
- Uses `gl.scissor` to track DOM elements and render 3D content at their positions
- Supports orbit controls via `orbit` prop
- Wrap 3D content with `<View>` and include `<Common>` for standard lighting

### Server vs Client Components

- Use `'use client'` directive for any component using Three.js/R3F
- Use `dynamic(() => import(...), { ssr: false })` for 3D components
- Wrap async 3D content in `<Suspense>` boundaries

## Key Patterns

### Adding 3D Components

```jsx
'use client'
import { useGLTF } from '@react-three/drei'

export function MyModel(props) {
  const { scene } = useGLTF('/model.glb')
  return <primitive object={scene} {...props} />
}
```

### Using 3D in Pages

```jsx
import { View, Common } from '@/components/canvas/View'

<View orbit className="relative h-96 w-full">
  <Suspense fallback={null}>
    <MyModel scale={2} />
    <Common color="lightblue" />
  </Suspense>
</View>
```

## Configuration

- **Path aliases:** `@/*` maps to both `app/*` and `src/*`
- **GLSL shaders:** Imported as strings via glslify-loader (supports `.glsl`, `.vert`, `.frag`)
- **Audio files:** Supported via url-loader (`.ogg`, `.mp3`, `.wav`)
- **Formatting:** No semicolons, single quotes, 120 char width, 2-space indent
