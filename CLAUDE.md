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

## Animations Guidelines

### Keep your animations fast

- Default to use `ease-out` for most animations.
- Animations should never be longer than 1s (unless it's illustrative), most of them should be around 0.2s to 0.3s.

### Easing rules

- Don't use built-in CSS easings unless it's `ease` or `linear`.
- Use the following easings for their described use case:
  - **`ease-in`**: (Starts slow, speeds up) Should generally be avoided as it makes the UI feel slow.
    - `ease-in-quad`: `cubic-bezier(.55, .085, .68, .53)`
    - `ease-in-cubic`: `cubic-bezier(.550, .055, .675, .19)`
    - `ease-in-quart`: `cubic-bezier(.895, .03, .685, .22)`
    - `ease-in-quint`: `cubic-bezier(.755, .05, .855, .06)`
    - `ease-in-expo`: `cubic-bezier(.95, .05, .795, .035)`
    - `ease-in-circ`: `cubic-bezier(.6, .04, .98, .335)`

  - **`ease-out`**: (Starts fast, slows down) Best for elements entering the screen or user-initiated interactions.
    - `ease-out-quad`: `cubic-bezier(.25, .46, .45, .94)`
    - `ease-out-cubic`: `cubic-bezier(.215, .61, .355, 1)`
    - `ease-out-quart`: `cubic-bezier(.165, .84, .44, 1)`
    - `ease-out-quint`: `cubic-bezier(.23, 1, .32, 1)`
    - `ease-out-expo`: `cubic-bezier(.19, 1, .22, 1)`
    - `ease-out-circ`: `cubic-bezier(.075, .82, .165, 1)`

  - **`ease-in-out`**: (Smooth acceleration and deceleration) Perfect for elements moving within the screen.
    - `ease-in-out-quad`: `cubic-bezier(.455, .03, .515, .955)`
    - `ease-in-out-cubic`: `cubic-bezier(.645, .045, .355, 1)`
    - `ease-in-out-quart`: `cubic-bezier(.77, 0, .175, 1)`
    - `ease-in-out-quint`: `cubic-bezier(.86, 0, .07, 1)`
    - `ease-in-out-expo`: `cubic-bezier(1, 0, 0, 1)`
    - `ease-in-out-circ`: `cubic-bezier(.785, .135, .15, .86)`

### Hover transitions

- Use the built-in CSS `ease` with a duration of `200ms` for simple hover transitions like `color`, `background-color`, `opacity`.
- Fall back to easing rules for more complex hover transitions.
- Disable hover transitions on touch devices with the `@media (hover: hover) and (pointer: fine)` media query.

### Accessibility

- If `transform` is used in the animation, disable it in the `prefers-reduced-motion` media query.

### Origin-aware animations

- Elements should animate from the trigger. If you open a dropdown or a popover it should animate from the button. Change `transform-origin` according to the trigger position.

### Performance

- Stick to opacity and transforms when possible. Example: Animate using `transform` instead of `top`, `left`, etc. when trying to move an element.
- Do not animate drag gestures using CSS variables.
- Do not animate blur values higher than 20px.
- Use `will-change` to optimize your animation, but use it only for: `transform`, `opacity`, `clipPath`, `filter`.
- When using Motion/Framer Motion use `transform` instead of `x` or `y` if you need animations to be hardware accelerated.

### Spring animations

- Default to spring animations when using Framer Motion.
- Avoid using bouncy spring animations unless you are working with drag gestures.
