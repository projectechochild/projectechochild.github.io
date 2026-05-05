# Echo Child - Lightweight Cinematic Scene

Optimized version of the Echo Child website with identical folder structure and image names.

## Directory Structure

```
cinematic-scene/
├── node_m-28/           # Server scripts
│   └── server.js        # Static file server (Bun + Node.js compatible)
├── assets/
│   ├── fonts/           # Armavir 03 font files
│   └── images/          # All images with EXACT same filenames
├── scripts/
│   ├── main.js          # Core functionality (vanilla JS)
│   └── loader.js        # Asset loader with lazy loading
├── styles/
│   └── style.css        # Optimized CSS (no heavy animations)
├── index.html
├── cast.html
├── locations.html
├── behind-scenes.html
├── horror-stories.html
├── comics.html
└── about.html
```

## Performance Optimizations

### Removed for Performance:
- Continuous CSS animations (heroImageMove, titleGlitch, transitionGlitch, windowFlicker)
- Heavy 3D transforms (perspective, rotateX)
- backdrop-filter (GPU intensive)
- Auto-page-load feature
- Swipe navigation
- Duplicate CSS variable blocks

### Added for Performance:
- `<picture>` elements for WebP fallback
- `loading="lazy"` on non-critical images
- IntersectionObserver for scroll animations
- `prefers-reduced-motion` media query
- CSS-only transitions (no JS animation loops)
- Asset preloader for critical images only

## Running the Server

### With Node.js:
```bash
cd cinematic-scene
node node_m-28/server.js
```

### With Bun:
```bash
cd cinematic-scene
bun node_m-28/server.js
```

Server runs at: http://localhost:3000

## Features

- **Lightweight**: No frameworks, vanilla JS only
- **Low Memory**: No continuous animation loops
- **Fast Loading**: Lazy loading + asset optimization
- **Cross-Platform**: Works on Windows, macOS, Linux
- **Runtime Agnostic**: Runs on both Bun and Node.js
- **Responsive**: Mobile-friendly with hamburger menu
- **Accessible**: Respects prefers-reduced-motion

## Scene Transition System

Simple fade-based transitions (no 3D transforms):
- Page exit: opacity 0.5s
- Transition overlay: opacity 0.3s
- Minimal DOM manipulation

## Browser Support

- Modern browsers with IntersectionObserver support
- Graceful fallback for older browsers
- WebP images with PNG/JPG fallback via `<picture>` element
