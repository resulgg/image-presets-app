# Lumina - Advanced Image Editor

A powerful, modern web-based image editor built with Next.js and React. Lumina provides a comprehensive suite of image editing tools with a beautiful, intuitive interface.

![Lumina Interface](public/screenshot.png)

## Features

- 🎨 Professional-grade image adjustments

  - Brightness, contrast, saturation
  - Exposure, highlights, shadows
  - Temperature and tint
  - Sharpness and blur
  - Gamma correction
  - Noise reduction

- ✨ Creative Effects

  - Vintage and retro filters
  - VHS and CRT effects
  - RGB shift and glitch effects
  - Light leaks and vignettes
  - Duotone and posterize
  - Custom presets

- 💫 Advanced Capabilities
  - Real-time preview
  - Undo/redo functionality
  - Multiple export formats (PNG, JPEG, WebP)
  - Touch and gesture support
  - Responsive design
  - Drag and resize interface

## Tech Stack

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: TailwindCSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Image Processing**: Canvas API
- **Development**: TypeScript

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lumina.git
cd lumina
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Click the "Change" button or drag and drop an image to start editing
2. Use the sidebar panels to access different editing tools:
   - Adjustments: Basic image corrections
   - Effects: Creative filters and effects
   - Presets: Quick-apply predefined looks
   - View: Pan and zoom controls
3. Use the top toolbar for:
   - Undo changes
   - Reset all adjustments
   - Change image
   - Export edited image

## Development

The project uses Next.js with TypeScript. Key directories:

- `/src/components`: React components
- `/src/store`: Zustand state management
- `/src/utils`: Utility functions
- `/src/hooks`: Custom React hooks
- `/src/constants`: Configuration constants

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
