# ASCII 0X — ASCII Art & Dither Shader Studio

<p align="center">
  <img src="public/icon-192.png" width="96" />
</p>

<p align="center">
  A retro-modern studio that converts images and video into stylized ASCII art, dither patterns, and pixel graphics — all in your browser.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

### 🎨 21 Rendering Styles
- **Characters** — Classic ASCII with brightness-mapped glyphs
- **Dither** — Ordered dithering with Bayer/Halftone matrices
- **Block** — Variable-size block rendering
- **Dots** — Circle-based halftone
- **PixelArt** — Crisp pixel grid
- **Mosaic** — Offset tile pattern
- **Lego** — Brick-style with highlights
- **Cross** — Diagonal cross-hatching
- **Diamond** — Diamond shapes
- **Lines** — Vertical bar heights
- **Braille** — Unicode Braille dot patterns
- **Voxel** — 3D-effect cubes
- **Disco** — Rainbow hue shift
- **Hexagon/Triangle/Star** — Geometric primitives
- **Spiral/Waves** — Procedural line art
- **Heart** — Heart-shaped cells

### 🔧 17 Dithering Algorithms
- **Ordered**: Bayer 2×2, 4×4, 8×8, 16×16, Halftone, Radial
- **Line**: Horizontal, Vertical, Diagonal
- **Noise**: White, Blue (16×16), Void-Cluster (32×32), Riemersma (Hilbert)
- **Error Diffusion**: Floyd–Steinberg, Atkinson, Stucki, Sierra Lite

### 🎨 18 Color Palettes
Mono, Grey (2/3-bit), Game Boy, CGA, Pico-8, C64, NES, RGB 3-bit, Cyberpunk, Pastel, Risograph, Sepia, Vintage, Earth, Original Colors, Custom

### 🖼️ Post-Processing Effects
Vignette, Scanlines, CRT, Chromatic Aberration, Bloom, Grain, Glitch, RGB Split, Pixelate, Dust

### 🎬 Video & Camera Support
- Load any video file and render it in real-time
- Live camera feed with ASCII overlay
- WebM recording at 30fps
- GIF export (10 frames @ 12fps)

### 📤 Export Options
- PNG/JPG/WebP at 1×, 2×, 4× scale
- SVG vector export
- Plain text (.txt) export
- Copy to clipboard

### 🌍 Bilingual (Arabic + English)
Full Arabic and English interface with RTL support.

### 📱 PWA Support
Install as a standalone app on any device.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript 6 |
| Styling | Tailwind CSS 4 |
| Build | Vite 8 |
| Lint | OxLint |
| PWA | vite-plugin-pwa (Workbox) |
| GIF | gifenc |

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `I` | Inspire (random style + background) |
| `R` | Restyle (random style + palette) |
| `E` | Export dialog |
| `C` | Crop dialog |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Space` | Play/Pause video |

---

## 📁 Project Structure

```
ascii-0x/
├── src/
│   ├── engine/          # Core rendering engine
│   │   ├── render.ts    # Main render pipeline
│   │   ├── matrices.ts  # Dithering algorithms
│   │   ├── palettes.ts  # Color palettes
│   │   ├── postfx.ts    # Post-processing effects
│   │   ├── color.ts     # Color filters & tinting
│   │   ├── exporter.ts  # Image/text/SVG export
│   │   ├── recipes.ts   # Preset configurations
│   │   ├── video.ts     # Video/camera/GIF manager
│   │   ├── demo.ts      # Demo backgrounds
│   │   └── types.ts     # TypeScript definitions
│   ├── components/      # React UI components
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization
│   ├── App.tsx          # Main application
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── dist/                # Production build
```

---

## 🎯 Recipes

Save and share your favorite configurations as compact URL-encoded recipes. Click "☰ Recipes" to browse built-in presets or save your own.

---

## 📄 License

MIT — Use freely for personal and commercial projects.
