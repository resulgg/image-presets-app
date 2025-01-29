"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useImageStore } from "@/store/imageStore";
import Adjustments from "@/components/filters/Adjustments";
import Effects from "@/components/filters/Effects";
import Presets from "@/components/filters/Presets";
import {
  FiDownload,
  FiRefreshCcw,
  FiRotateCcw,
  FiImage,
  FiX,
  FiSliders,
  FiFeather,
  FiMove,
  FiMaximize,
} from "react-icons/fi";

const tabs = [
  {
    id: "adjustments",
    label: "Adjustments",
    icon: FiSliders,
    color: "bg-black",
  },
  { id: "effects", label: "Effects", icon: FiFeather, color: "bg-black" },
  { id: "presets", label: "Presets", icon: FiImage, color: "bg-black" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.32, 0.72, 0, 1], // iOS easing
    },
  },
};

const buttonVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.32, 0.72, 0, 1], // iOS easing
    },
  },
};

export default function ImageEditor() {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState(() => {
    const savedPosition = localStorage.getItem("panelPosition");
    return savedPosition
      ? JSON.parse(savedPosition)
      : {
          x: window.innerWidth - 420,
          y: 20,
        };
  });
  const [panelSize, setPanelSize] = useState(() => {
    const savedSize = localStorage.getItem("panelSize");
    return savedSize
      ? JSON.parse(savedSize)
      : {
          width: 400,
          height: window.innerHeight - 120,
        };
  });
  const { image, filters, resetFilters, undo, setImage } = useImageStore();
  const dragControls = useDragControls();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDistance = useRef<number | null>(null);
  // Add this state to track if view is modified
  const [isViewModified, setIsViewModified] = useState(false);

  // Save panel position and size to localStorage when they change
  useEffect(() => {
    if (panelPosition) {
      localStorage.setItem("panelPosition", JSON.stringify(panelPosition));
    }
  }, [panelPosition]);

  useEffect(() => {
    if (panelSize) {
      localStorage.setItem("panelSize", JSON.stringify(panelSize));
    }
  }, [panelSize]);

  // Track panel size changes with ResizeObserver
  useEffect(() => {
    if (!panelRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPanelSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(panelRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const applyHeavyFilters = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Create lookup tables for gamma correction
      const gammaLookup = new Uint8Array(256);
      if (filters.gamma !== 1) {
        const gammaCorrection = 1 / filters.gamma;
        for (let i = 0; i < 256; i++) {
          gammaLookup[i] = Math.round(255 * Math.pow(i / 255, gammaCorrection));
        }
      }

      // Process all pixel manipulations in a single pass
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply gamma correction first if enabled
        if (filters.gamma !== 1) {
          r = gammaLookup[r];
          g = gammaLookup[g];
          b = gammaLookup[b];
        }

        // Apply posterize effect if enabled
        if (filters.posterize > 0) {
          const levels = Math.max(2, Math.round(20 - filters.posterize));
          const step = 255 / (levels - 1);
          r = Math.round(Math.round(r / step) * step);
          g = Math.round(Math.round(g / step) * step);
          b = Math.round(Math.round(b / step) * step);
        }

        // Calculate luminance (perceived brightness)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Apply highlights (affects brighter areas more)
        if (filters.highlights !== 0) {
          if (luminance > 0.5) {
            const factor =
              1 + (filters.highlights / 100) * (luminance - 0.5) * 2;
            r = Math.min(255, Math.round(r * factor));
            g = Math.min(255, Math.round(g * factor));
            b = Math.min(255, Math.round(b * factor));
          }
        }

        // Apply shadows (affects darker areas more)
        if (filters.shadows !== 0) {
          if (luminance < 0.5) {
            const factor = 1 + (filters.shadows / 100) * (0.5 - luminance) * 2;
            r = Math.min(255, Math.round(r * factor));
            g = Math.min(255, Math.round(g * factor));
            b = Math.min(255, Math.round(b * factor));
          }
        }

        // Apply vibrance
        if (filters.vibrance !== 100) {
          const avg = (r + g + b) / 3;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = (max - min) / (max + 0.001);
          const amount = ((filters.vibrance - 100) / 100) * 2;
          const factor = 1 + amount * (1 - saturation);

          r = Math.min(255, Math.max(0, Math.round(r + (r - avg) * factor)));
          g = Math.min(255, Math.max(0, Math.round(g + (g - avg) * factor)));
          b = Math.min(255, Math.max(0, Math.round(b + (b - avg) * factor)));
        }

        // Store the modified pixel values
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      // Apply noise if enabled
      if (filters.noise > 0) {
        for (let i = 0; i < data.length; i += 4) {
          if (Math.random() > 0.5) {
            const noise = (Math.random() - 0.5) * filters.noise * 2;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
          }
        }
      }

      // Apply duotone if enabled
      if (filters.duotone && filters.duotoneColors?.length === 2) {
        const color1 = filters.duotoneColors[0];
        const color2 = filters.duotoneColors[1];

        // Create a lookup table for duotone colors
        const duotoneLookup = new Array(256);
        for (let i = 0; i < 256; i++) {
          const t = i / 255;
          duotoneLookup[i] = {
            r: Math.round(color1.r * (1 - t) + color2.r * t),
            g: Math.round(color1.g * (1 - t) + color2.g * t),
            b: Math.round(color1.b * (1 - t) + color2.b * t),
          };
        }

        for (let i = 0; i < data.length; i += 4) {
          const avg = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
          const color = duotoneLookup[avg];
          data[i] = color.r;
          data[i + 1] = color.g;
          data[i + 2] = color.b;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Apply vignette last
      if (filters.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
        );

        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.5, `rgba(0,0,0,${filters.vignette * 0.003})`);
        gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette * 0.01})`);

        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      }
    },
    [filters]
  );

  const renderCanvas = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      shouldDownload: boolean = false,
      format: "png" | "jpeg" | "webp" = "png"
    ) => {
      if (!canvas || !image) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        // Reset canvas dimensions and clear previous content
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset all composite operations and filters
        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";

        // Draw the original image first
        ctx.drawImage(img, 0, 0);

        // Apply base CSS filters first
        const baseFilter = `
          brightness(${filters.brightness}%)
          contrast(${filters.contrast}%)
          saturate(${filters.saturation}%)
          hue-rotate(${filters.hueRotate}deg)
          invert(${filters.invert}%)
          sepia(${filters.sepia}%)
          grayscale(${filters.grayscale}%)
          opacity(${filters.opacity}%)
        `.trim();

        // Apply blur with optimized Gaussian algorithm
        if (filters.blur > 0) {
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            // Scale down for better performance
            const scale = Math.min(1, Math.max(0.25, 1 - filters.blur / 200));
            const scaledWidth = Math.floor(canvas.width * scale);
            const scaledHeight = Math.floor(canvas.height * scale);

            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;

            // Draw scaled down image with base filters
            tempCtx.filter = baseFilter;
            tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            // Get image data for Gaussian blur
            const imageData = tempCtx.getImageData(
              0,
              0,
              scaledWidth,
              scaledHeight
            );
            const data = imageData.data;

            // Scale blur value and optimize parameters
            const scaledBlur = (filters.blur / 100) * 25; // Reduced range for better performance
            const radius = Math.ceil(scaledBlur);
            const sigma = scaledBlur * 0.5;
            const kernelSize = radius * 2 + 1;
            const kernel = new Float32Array(kernelSize);

            // Pre-calculate kernel values
            let sum = 0;
            const twoSigmaSquare = 2 * sigma * sigma;
            const sigmaPi = sigma * Math.sqrt(2 * Math.PI);

            for (let i = 0; i < kernelSize; i++) {
              const x = i - radius;
              kernel[i] = Math.exp(-(x * x) / twoSigmaSquare) / sigmaPi;
              sum += kernel[i];
            }

            // Normalize kernel
            for (let i = 0; i < kernelSize; i++) {
              kernel[i] /= sum;
            }

            // Optimized buffer for better memory usage
            const buff = new Uint8ClampedArray(scaledWidth * scaledHeight * 4);

            // Horizontal pass with optimized memory access
            for (let y = 0; y < scaledHeight; y++) {
              for (let x = 0; x < scaledWidth; x++) {
                let r = 0,
                  g = 0,
                  b = 0,
                  a = 0;
                const targetIdx = (y * scaledWidth + x) * 4;

                for (let k = -radius; k <= radius; k++) {
                  const sourceX = Math.min(Math.max(x + k, 0), scaledWidth - 1);
                  const weight = kernel[k + radius];
                  const idx = (y * scaledWidth + sourceX) * 4;

                  r += data[idx] * weight;
                  g += data[idx + 1] * weight;
                  b += data[idx + 2] * weight;
                  a += data[idx + 3] * weight;
                }

                buff[targetIdx] = r;
                buff[targetIdx + 1] = g;
                buff[targetIdx + 2] = b;
                buff[targetIdx + 3] = a;
              }
            }

            // Vertical pass with optimized memory access
            for (let y = 0; y < scaledHeight; y++) {
              for (let x = 0; x < scaledWidth; x++) {
                let r = 0,
                  g = 0,
                  b = 0,
                  a = 0;
                const targetIdx = (y * scaledWidth + x) * 4;

                for (let k = -radius; k <= radius; k++) {
                  const sourceY = Math.min(
                    Math.max(y + k, 0),
                    scaledHeight - 1
                  );
                  const weight = kernel[k + radius];
                  const idx = (sourceY * scaledWidth + x) * 4;

                  r += buff[idx] * weight;
                  g += buff[idx + 1] * weight;
                  b += buff[idx + 2] * weight;
                  a += buff[idx + 3] * weight;
                }

                data[targetIdx] = r;
                data[targetIdx + 1] = g;
                data[targetIdx + 2] = b;
                data[targetIdx + 3] = a;
              }
            }

            // Put the blurred image data back
            tempCtx.putImageData(imageData, 0, 0);

            // Scale back up to original size with smooth interpolation
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          }
        } else {
          // If no blur, just apply other filters
          ctx.filter = baseFilter;
          ctx.drawImage(img, 0, 0);
        }
        ctx.filter = "none";

        // Apply sharpen effect if enabled
        if (filters.sharpen > 0) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = canvas.width;
          const height = canvas.height;
          const factor = 1 + filters.sharpen / 50; // Scale from 1 to 3 for stronger effect

          // Sharpen kernel matrix with stronger values
          const kernel = [0, -1.5, 0, -1.5, 7, -1.5, 0, -1.5, 0];

          // Create a temporary array to store the original pixels
          const original = new Uint8ClampedArray(data);

          // Apply convolution
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;

              for (let c = 0; c < 3; c++) {
                // Only process RGB channels
                let sum = 0;

                // Apply kernel
                sum += original[((y - 1) * width + x) * 4 + c] * kernel[1]; // N
                sum += original[(y * width + (x - 1)) * 4 + c] * kernel[3]; // W
                sum += original[(y * width + x) * 4 + c] * kernel[4]; // Center
                sum += original[(y * width + (x + 1)) * 4 + c] * kernel[5]; // E
                sum += original[((y + 1) * width + x) * 4 + c] * kernel[7]; // S

                // Apply the sharpening with increased intensity
                const sharpened =
                  original[idx + c] + (sum - original[idx + c]) * (factor - 1);
                data[idx + c] = Math.min(255, Math.max(0, sharpened));
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Apply pixelate effect if enabled
        if (filters.pixelate > 0) {
          // Much larger pixelation size (1-100 pixels)
          const pixelSize = Math.max(
            2,
            Math.ceil((filters.pixelate / 100) * 20)
          );

          // Create a temporary canvas for pixelation
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            // Set the temporary canvas size
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Draw current state to temp canvas
            tempCtx.drawImage(canvas, 0, 0);

            // Clear original canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Disable image smoothing
            ctx.imageSmoothingEnabled = false;
            tempCtx.imageSmoothingEnabled = false;

            // Calculate scaled dimensions
            const w = Math.ceil(canvas.width / pixelSize);
            const h = Math.ceil(canvas.height / pixelSize);

            // Draw small
            ctx.drawImage(tempCanvas, 0, 0, w, h);
            // Draw back to original size
            ctx.drawImage(
              canvas,
              0,
              0,
              w,
              h,
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Re-enable image smoothing for other effects
            ctx.imageSmoothingEnabled = true;
          }
        }

        // Apply transforms last
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (filters.flipHorizontal) ctx.scale(-1, 1);
        if (filters.flipVertical) ctx.scale(1, -1);
        ctx.drawImage(
          canvas,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        );
        ctx.restore();

        // Reset composite operation for other effects
        ctx.filter = "none";

        // Apply exposure
        if (filters.exposure !== 100) {
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = `rgba(255, 255, 255, ${filters.exposure / 100 - 1})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        // Apply temperature and tint together
        if (filters.temperature !== 0 || filters.tint !== 0) {
          ctx.globalCompositeOperation = "soft-light";
          const temp = filters.temperature;
          const tint = filters.tint;
          const r = temp > 0 ? 255 : 255 - Math.abs(temp * 2);
          const g = tint > 0 ? 255 : 255 - Math.abs(tint * 2);
          const b = temp < 0 ? 255 : 255 - Math.abs(temp * 2);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        // Apply glow effect if enabled
        if (filters.glow > 0) {
          // Create a temporary canvas for the glow effect
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Draw current state to temp canvas
            tempCtx.drawImage(canvas, 0, 0);

            // Apply blur for glow using glowRadius
            const blurAmount = filters.glowRadius || filters.glow * 5;
            const brightnessBoost = 100 + (filters.glowIntensity || 50);
            tempCtx.filter = `blur(${blurAmount}px) brightness(${brightnessBoost}%)`;
            tempCtx.globalCompositeOperation = "screen";
            tempCtx.drawImage(tempCanvas, 0, 0);

            // Blend the glow back onto the original with intensity
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = filters.glow / 100;
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.globalAlpha = 1;
          }
        }

        // Apply glitter effect
        if (filters.glitter > 0) {
          ctx.globalCompositeOperation = "screen";
          const { r, g, b } = filters.glitterColor;
          const numParticles =
            Math.floor((canvas.width * canvas.height) / 10000) *
            (filters.glitter / 100);

          // Create a temporary canvas for blur effect
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.filter = `blur(${filters.glitterBlur}px)`;

            for (let i = 0; i < numParticles; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const baseSize = filters.glitterSize;
              const size = baseSize * (Math.random() * 0.5 + 0.75); // Random size variation
              const opacity = Math.random() * 0.5 + 0.5;
              const rotation = Math.random() * Math.PI * 2;

              tempCtx.save();
              tempCtx.translate(x, y);
              tempCtx.rotate(rotation);

              tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${
                (opacity * filters.glitter) / 100
              })`;

              switch (filters.glitterShape) {
                case "circle":
                  tempCtx.beginPath();
                  tempCtx.arc(0, 0, size, 0, Math.PI * 2);
                  tempCtx.fill();
                  break;

                case "star":
                  const spikes = 5;
                  const outerRadius = size;
                  const innerRadius = size * 0.4;

                  tempCtx.beginPath();
                  for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) tempCtx.moveTo(x, y);
                    else tempCtx.lineTo(x, y);
                  }
                  tempCtx.closePath();
                  tempCtx.fill();
                  break;

                case "diamond":
                  tempCtx.beginPath();
                  tempCtx.moveTo(0, -size);
                  tempCtx.lineTo(size, 0);
                  tempCtx.lineTo(0, size);
                  tempCtx.lineTo(-size, 0);
                  tempCtx.closePath();
                  tempCtx.fill();
                  break;

                case "square":
                  tempCtx.fillRect(-size, -size, size * 2, size * 2);
                  break;

                case "heart":
                  const heartSize = size * 1.5;
                  tempCtx.beginPath();
                  tempCtx.moveTo(0, heartSize);

                  // Left curve
                  tempCtx.bezierCurveTo(
                    -heartSize,
                    heartSize * 0.4,
                    -heartSize,
                    -heartSize * 0.4,
                    0,
                    -heartSize * 0.4
                  );

                  // Right curve
                  tempCtx.bezierCurveTo(
                    heartSize,
                    -heartSize * 0.4,
                    heartSize,
                    heartSize * 0.4,
                    0,
                    heartSize
                  );

                  tempCtx.fill();
                  break;
              }

              tempCtx.restore();
            }

            // Draw the blurred glitter onto the main canvas
            ctx.drawImage(tempCanvas, 0, 0);
          }

          ctx.globalCompositeOperation = "source-over";
        }

        // Apply VHS and CRT effects
        if (filters.vhs > 0 || filters.scanlines > 0) {
          const strength = filters.vhs / 100;
          const scanlinesStrength = filters.scanlines / 100;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const tempData = new Uint8ClampedArray(data);

          // Apply VHS tracking distortion and color bleeding
          if (filters.vhs > 0) {
            const time = Date.now() * 0.001;

            for (let y = 0; y < canvas.height; y++) {
              // Enhanced vertical tracking distortion with more intensity and randomness
              const trackingOffset =
                Math.sin(y * 0.1 + time * 2) * 12 * strength;
              const trackingJitter = (Math.random() - 0.5) * 25 * strength;
              const verticalShift = Math.floor(trackingOffset + trackingJitter);

              // Vertical sync issues (random jumps)
              const syncJump =
                Math.random() < 0.001 * strength
                  ? Math.floor(Math.random() * 20) - 10
                  : 0;

              // Apply vertical shift to entire scanline with sync issues
              if (Math.abs(verticalShift + syncJump) > 0) {
                for (let x = 0; x < canvas.width; x++) {
                  const targetY = Math.max(
                    0,
                    Math.min(canvas.height - 1, y + verticalShift + syncJump)
                  );
                  const targetIdx = (y * canvas.width + x) * 4;
                  const sourceIdx = (targetY * canvas.width + x) * 4;

                  data[targetIdx] = tempData[sourceIdx];
                  data[targetIdx + 1] = tempData[sourceIdx + 1];
                  data[targetIdx + 2] = tempData[sourceIdx + 2];
                }
              }

              // Enhanced static noise effect with more intensity
              if (Math.random() < 0.5 * strength) {
                for (let x = 0; x < canvas.width; x++) {
                  if (Math.random() < 0.4) {
                    const idx = (y * canvas.width + x) * 4;
                    const noise = Math.random() * 80 * strength;
                    data[idx] = Math.min(255, data[idx] + noise);
                    data[idx + 1] = Math.min(255, data[idx + 1] + noise);
                    data[idx + 2] = Math.min(255, data[idx + 2] + noise);
                  }
                }
              }

              // Enhanced color bleeding and channel separation
              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;

                // More pronounced RGB channel separation
                const rOffset = Math.sin(y * 0.03 + time * 2) * 12 * strength;
                const gOffset =
                  Math.sin(y * 0.03 + time * 2 + Math.PI / 3) * 8 * strength;
                const bOffset =
                  Math.sin(y * 0.03 + time * 2 + (Math.PI * 2) / 3) *
                  12 *
                  strength;

                const rIdx = (y * canvas.width + Math.floor(x + rOffset)) * 4;
                const gIdx = (y * canvas.width + Math.floor(x + gOffset)) * 4;
                const bIdx = (y * canvas.width + Math.floor(x + bOffset)) * 4;

                // Apply enhanced color separation
                if (rIdx >= 0 && rIdx < data.length) {
                  data[idx] = tempData[rIdx];
                }
                if (gIdx >= 0 && gIdx < data.length) {
                  data[idx + 1] = tempData[gIdx + 1];
                }
                if (bIdx >= 0 && bIdx < data.length) {
                  data[idx + 2] = tempData[bIdx + 2];
                }

                // Enhanced noise and brightness fluctuation
                const noise = (Math.random() - 0.5) * 60 * strength;
                const flicker = 1 + Math.sin(time * 10) * 0.1 * strength; // Added flickering effect
                const brightness =
                  flicker * (1 + Math.sin(y * 0.02 + time) * 0.2 * strength);

                // Apply effects with more noise emphasis
                data[idx] = Math.max(
                  0,
                  Math.min(255, data[idx] * brightness + noise)
                );
                data[idx + 1] = Math.max(
                  0,
                  Math.min(255, data[idx + 1] * brightness + noise)
                );
                data[idx + 2] = Math.max(
                  0,
                  Math.min(255, data[idx + 2] * brightness + noise)
                );
              }

              // More frequent and intense horizontal jitter lines
              if (Math.random() < 0.03 * strength) {
                const jitterOffset = (Math.random() - 0.5) * 60 * strength;
                const jitterIntensity = 0.7 + Math.random() * 0.5;
                for (let x = 0; x < canvas.width; x++) {
                  const targetIdx = (y * canvas.width + x) * 4;
                  const sourceX = Math.floor(x + jitterOffset);
                  if (sourceX >= 0 && sourceX < canvas.width) {
                    const sourceIdx = (y * canvas.width + sourceX) * 4;
                    data[targetIdx] = tempData[sourceIdx] * jitterIntensity;
                    data[targetIdx + 1] =
                      tempData[sourceIdx + 1] * jitterIntensity;
                    data[targetIdx + 2] =
                      tempData[sourceIdx + 2] * jitterIntensity;
                  }
                }
              }
            }
          }

          // Enhanced scanlines with more pronounced effect
          if (filters.scanlines > 0) {
            for (let y = 0; y < canvas.height; y++) {
              const scanlineIntensity = Math.sin(y * 2) * 0.9 + 0.1;
              const darkness = 1 - scanlinesStrength * scanlineIntensity * 1.2;

              // Add random scanline noise
              const scanlineNoise =
                Math.random() < 0.3 ? 0.8 + Math.random() * 0.4 : 1;

              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const finalDarkness = darkness * scanlineNoise;
                data[idx] *= finalDarkness;
                data[idx + 1] *= finalDarkness;
                data[idx + 2] *= finalDarkness;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Subtle blur for VHS effect
          if (filters.vhs > 0) {
            ctx.filter = `blur(${strength * 0.8}px)`;
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = "none";
          }
        }

        // Apply enhanced RGB Shift
        if (filters.rgbShift > 0) {
          const strength = (filters.rgbShift / 100) * 40;

          // Create temporary canvas
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(canvas, 0, 0);

            // Get image data
            const imageData = tempCtx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            // Create output image data
            const output = new ImageData(canvas.width, canvas.height);

            // Calculate center point
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxDistance =
              Math.sqrt(
                canvas.width * canvas.width + canvas.height * canvas.height
              ) / 2;

            // Process each pixel
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;

                // Calculate distance from center point
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const normalizedDistance = Math.min(1, distance / maxDistance);

                // Calculate angle from center
                const angle = Math.atan2(dy, dx);

                // RGB Shift effect
                for (let channel = 0; channel < 3; channel++) {
                  const channelAngle =
                    angle + (channel - 1) * ((2 * Math.PI) / 3);
                  const offset = strength * normalizedDistance;

                  const sourceX = x + Math.cos(channelAngle) * offset;
                  const sourceY = y + Math.sin(channelAngle) * offset;

                  const boundedX = Math.max(
                    0,
                    Math.min(canvas.width - 1, sourceX)
                  );
                  const boundedY = Math.max(
                    0,
                    Math.min(canvas.height - 1, sourceY)
                  );

                  const sourceIndex =
                    (Math.floor(boundedY) * canvas.width +
                      Math.floor(boundedX)) *
                    4;
                  output.data[i + channel] = data[sourceIndex + channel];
                }
                // Copy alpha channel
                output.data[i + 3] = data[i + 3];
              }
            }

            // Apply the processed image
            ctx.putImageData(output, 0, 0);
          }
        }

        // Apply old film effect
        if (filters.oldFilm > 0) {
          const oldFilmStrength = filters.oldFilm / 100;

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Add sepia tint
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(
              255,
              r * (1 - 0.607 * oldFilmStrength) +
                (g + b) * 0.469 * oldFilmStrength
            );
            data[i + 1] = Math.min(
              255,
              g * (1 - 0.283 * oldFilmStrength) +
                (r + b) * 0.349 * oldFilmStrength
            );
            data[i + 2] = Math.min(
              255,
              b * (1 - 0.111 * oldFilmStrength) +
                (r + g) * 0.189 * oldFilmStrength
            );
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Enhanced Glitch Effect
        if (filters.glitch > 0) {
          const strength = filters.glitch / 100;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const tempData = new Uint8ClampedArray(data);

          // Random glitch blocks with more variety
          const numGlitches = Math.floor(strength * 30); // Increased number of glitches
          for (let i = 0; i < numGlitches; i++) {
            const blockHeight = Math.random() * 100 * strength; // Increased block height
            const y = Math.floor(Math.random() * canvas.height);
            const blockType = Math.random();

            if (blockType < 0.4) {
              // Horizontal shift
              const shiftAmount = Math.random() * 50 * strength; // Increased shift amount
              const direction = Math.random() < 0.5 ? -1 : 1;
              for (
                let blockY = y;
                blockY < Math.min(y + blockHeight, canvas.height);
                blockY++
              ) {
                for (let x = 0; x < canvas.width; x++) {
                  const sourceX = Math.floor(x + shiftAmount * direction);
                  if (sourceX >= 0 && sourceX < canvas.width) {
                    const targetIndex = (blockY * canvas.width + x) * 4;
                    const sourceIndex = (blockY * canvas.width + sourceX) * 4;
                    data[targetIndex] = tempData[sourceIndex];
                    data[targetIndex + 1] = tempData[sourceIndex + 1];
                    data[targetIndex + 2] = tempData[sourceIndex + 2];
                  }
                }
              }
            } else if (blockType < 0.7) {
              // RGB split
              const splitAmount = Math.random() * 30 * strength; // Increased split amount
              for (
                let blockY = y;
                blockY < Math.min(y + blockHeight, canvas.height);
                blockY++
              ) {
                for (let x = 0; x < canvas.width; x++) {
                  const targetIndex = (blockY * canvas.width + x) * 4;
                  const sourceIndexR =
                    (blockY * canvas.width + Math.floor(x + splitAmount)) * 4;
                  const sourceIndexB =
                    (blockY * canvas.width + Math.floor(x - splitAmount)) * 4;

                  if (sourceIndexR < data.length && sourceIndexB >= 0) {
                    data[targetIndex] = tempData[sourceIndexR]; // Red channel
                    data[targetIndex + 2] = tempData[sourceIndexB + 2]; // Blue channel
                  }
                }
              }
            } else {
              // Digital corruption effect
              for (
                let blockY = y;
                blockY < Math.min(y + blockHeight, canvas.height);
                blockY++
              ) {
                for (let x = 0; x < canvas.width; x++) {
                  if (Math.random() < strength * 0.4) {
                    // Increased corruption probability
                    const targetIndex = (blockY * canvas.width + x) * 4;
                    if (Math.random() < 0.5) {
                      // Random color corruption
                      data[targetIndex] = Math.random() * 255; // R
                      data[targetIndex + 1] = Math.random() * 255; // G
                      data[targetIndex + 2] = Math.random() * 255; // B
                    } else {
                      // Extreme brightness corruption
                      const brightness = Math.random() < 0.5 ? 0 : 255;
                      data[targetIndex] = brightness; // R
                      data[targetIndex + 1] = brightness; // G
                      data[targetIndex + 2] = brightness; // B
                    }
                  }
                }
              }
            }
          }

          // Add random color noise and artifacts
          if (Math.random() < strength) {
            const numNoiseLines = Math.floor(strength * 10); // Increased noise lines
            for (let i = 0; i < numNoiseLines; i++) {
              const noiseY = Math.floor(Math.random() * canvas.height);
              const noiseHeight = Math.floor(Math.random() * 20 + 1); // Increased noise height
              const noiseType = Math.random();

              for (
                let y = noiseY;
                y < Math.min(noiseY + noiseHeight, canvas.height);
                y++
              ) {
                for (let x = 0; x < canvas.width; x++) {
                  const i = (y * canvas.width + x) * 4;
                  if (noiseType < 0.3) {
                    // White noise
                    data[i] = data[i + 1] = data[i + 2] = 255;
                  } else if (noiseType < 0.6) {
                    // Black noise
                    data[i] = data[i + 1] = data[i + 2] = 0;
                  } else {
                    // Random color noise
                    data[i] = Math.random() * 255;
                    data[i + 1] = Math.random() * 255;
                    data[i + 2] = Math.random() * 255;
                  }
                }
              }
            }
          }

          // Add random vertical color streaks
          if (Math.random() < strength * 0.8) {
            const numStreaks = Math.floor(strength * 15);
            for (let i = 0; i < numStreaks; i++) {
              const x = Math.floor(Math.random() * canvas.width);
              const width = Math.floor(Math.random() * 10 + 1);
              const color = {
                r: Math.random() * 255,
                g: Math.random() * 255,
                b: Math.random() * 255,
              };

              for (let y = 0; y < canvas.height; y++) {
                for (let dx = 0; dx < width; dx++) {
                  if (x + dx < canvas.width) {
                    const index = (y * canvas.width + x + dx) * 4;
                    data[index] = color.r;
                    data[index + 1] = color.g;
                    data[index + 2] = color.b;
                  }
                }
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Apply wave distortion
        if (filters.distortion > 0) {
          const strength = filters.distortion / 100;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const tempData = new Uint8ClampedArray(data);

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Pre-calculate values for optimization
          const maxDistance = Math.min(canvas.width, canvas.height) / 2;
          const width = canvas.width;
          const height = canvas.height;

          // Create lookup tables for expensive calculations
          const sinTable = new Float32Array(360);
          const cosTable = new Float32Array(360);
          for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            sinTable[i] = Math.sin(angle);
            cosTable[i] = Math.cos(angle);
          }

          // Batch process pixels in chunks for better performance
          const chunkSize = 1000;
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j += chunkSize) {
              const endJ = Math.min(j + chunkSize, width);
              for (let x = j; x < endJ; x++) {
                let sourceX = x;
                let sourceY = i;

                // Apply distortion effect
                const dx = x - centerX;
                const dy = i - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const normalizedDistance = distance / maxDistance;

                switch (filters.distortionType) {
                  case "swirl":
                    const angle =
                      Math.atan2(dy, dx) +
                      strength * (1 - normalizedDistance) * Math.PI * 2;
                    sourceX = centerX + Math.cos(angle) * distance;
                    sourceY = centerY + Math.sin(angle) * distance;
                    break;

                  case "squeeze":
                    const factor =
                      1 + Math.sin(normalizedDistance * Math.PI) * strength;
                    sourceX = centerX + dx * factor;
                    sourceY = centerY + dy * factor;
                    break;

                  case "wave":
                    const waveX = Math.sin(i * 0.1) * 20 * strength;
                    const waveY = Math.sin(x * 0.1) * 20 * strength;
                    sourceX = x + waveX;
                    sourceY = i + waveY;
                    break;

                  case "ripple":
                    const rippleDistance = distance * 0.1;
                    const rippleOffset =
                      Math.sin(rippleDistance * Math.PI * 4) * 20 * strength;
                    sourceX =
                      centerX + (dx / distance) * (distance + rippleOffset);
                    sourceY =
                      centerY + (dy / distance) * (distance + rippleOffset);
                    break;

                  case "vortex":
                    const vortexAngle = Math.atan2(dy, dx);
                    const vortexRadius =
                      distance * (1 + strength * Math.sin(vortexAngle * 3));
                    sourceX = centerX + Math.cos(vortexAngle) * vortexRadius;
                    sourceY = centerY + Math.sin(vortexAngle) * vortexRadius;
                    break;

                  case "pixelate":
                    const blockSize = Math.max(1, Math.floor(20 * strength));
                    sourceX = Math.floor(x / blockSize) * blockSize;
                    sourceY = Math.floor(i / blockSize) * blockSize;
                    break;

                  case "twist":
                    const twistAngle = Math.atan2(dy, dx);
                    const twistAmount =
                      strength * (1 - normalizedDistance) * Math.PI * 4;
                    const twistedAngle = twistAngle + twistAmount;
                    sourceX = centerX + Math.cos(twistedAngle) * distance;
                    sourceY = centerY + Math.sin(twistedAngle) * distance;
                    break;

                  case "zigzag":
                    const zigzagFreq = 50 * strength;
                    const zigzagAmp = 20 * strength;
                    const zigzagOffset =
                      Math.sin(distance / zigzagFreq) * zigzagAmp;
                    const zigzagAngle = Math.atan2(dy, dx);
                    sourceX = x + Math.cos(zigzagAngle) * zigzagOffset;
                    sourceY = i + Math.sin(zigzagAngle) * zigzagOffset;
                    break;

                  case "spiral":
                    const spiralAngle = Math.atan2(dy, dx);
                    const spiralRadius = distance + spiralAngle * strength * 20;
                    sourceX = centerX + Math.cos(spiralAngle) * spiralRadius;
                    sourceY = centerY + Math.sin(spiralAngle) * spiralRadius;
                    break;

                  case "bulge":
                    const bulgeStrength = 2 * strength;
                    const bulgeFactor = 1 - normalizedDistance * bulgeStrength;
                    sourceX = centerX + dx * bulgeFactor;
                    sourceY = centerY + dy * bulgeFactor;
                    break;
                }

                // Ensure source coordinates are within bounds
                sourceX = Math.max(0, Math.min(width - 1, sourceX));
                sourceY = Math.max(0, Math.min(height - 1, sourceY));

                const targetIndex = (i * width + x) * 4;
                const sourceIndex =
                  (Math.floor(sourceY) * width + Math.floor(sourceX)) * 4;

                // Copy RGB values
                data[targetIndex] = tempData[sourceIndex];
                data[targetIndex + 1] = tempData[sourceIndex + 1];
                data[targetIndex + 2] = tempData[sourceIndex + 2];
                data[targetIndex + 3] = tempData[sourceIndex + 3];
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Apply light leak effect
        if (filters.lightLeak > 0) {
          // Calculate direction vector based on angle
          const angle = (filters.lightLeakDirection * Math.PI) / 180;
          const x2 = canvas.width * Math.cos(angle);
          const y2 = canvas.height * Math.sin(angle);

          const gradient = ctx.createLinearGradient(0, 0, x2, y2);

          const { r, g, b } = filters.lightLeakColor;
          gradient.addColorStop(
            0,
            `rgba(${r}, ${g}, ${b}, ${filters.lightLeak / 200})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(${r}, ${g}, ${b}, ${filters.lightLeak / 400})`
          );
          gradient.addColorStop(
            1,
            `rgba(${r}, ${g}, ${b}, ${filters.lightLeak / 200})`
          );

          ctx.fillStyle = gradient;
          ctx.globalCompositeOperation = "screen";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        // Apply prism light effect if enabled
        if (filters.prismLight > 0) {
          const strength = filters.prismLight / 100;
          const angle = (filters.prismLightAngle * Math.PI) / 180; // Convert angle to radians
          const spread = filters.prismLightSpread / 100; // Normalize spread to 0-1

          // Create rainbow gradient with angle
          const startX = canvas.width / 2 - Math.cos(angle) * canvas.width;
          const startY = canvas.height / 2 - Math.sin(angle) * canvas.height;
          const endX = canvas.width / 2 + Math.cos(angle) * canvas.width;
          const endY = canvas.height / 2 + Math.sin(angle) * canvas.height;

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);

          // Adjust color stops based on spread
          const spreadFactor = 0.5 + spread * 0.5; // Spread factor between 0.5 and 1
          gradient.addColorStop(
            0,
            `rgba(255, 0, 0, ${strength * spreadFactor})`
          );
          gradient.addColorStop(
            0.2,
            `rgba(255, 165, 0, ${strength * spreadFactor})`
          );
          gradient.addColorStop(
            0.4,
            `rgba(255, 255, 0, ${strength * spreadFactor})`
          );
          gradient.addColorStop(
            0.6,
            `rgba(0, 255, 0, ${strength * spreadFactor})`
          );
          gradient.addColorStop(
            0.8,
            `rgba(0, 0, 255, ${strength * spreadFactor})`
          );
          gradient.addColorStop(
            1,
            `rgba(238, 130, 238, ${strength * spreadFactor})`
          );

          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        // Apply heavy pixel manipulations
        applyHeavyFilters(ctx, canvas.width, canvas.height);

        // Handle download if needed
        if (shouldDownload) {
          const link = document.createElement("a");
          link.download = `edited-image.${format}`;
          link.href = canvas.toDataURL(`image/${format}`);
          link.click();
        }
      };

      img.src = image;
    },
    [image, filters, applyHeavyFilters]
  );

  // Effect to re-render canvas when image or filters change
  useEffect(() => {
    renderCanvas(canvasRef.current);
  }, [image, filters, renderCanvas]);

  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (format: "png" | "jpeg" | "webp") => {
    const canvas = document.createElement("canvas");
    renderCanvas(canvas, true, format);
  };

  // Add these new functions before the renderCanvas function
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = 0.1; // Daha belirgin zoom için faktörü artırdım
        const newScale = Math.min(
          Math.max(0.1, scale + (delta > 0 ? zoomFactor : -zoomFactor)),
          5
        );
        setScale(newScale);
        setIsViewModified(
          newScale !== 1 || position.x !== 0 || position.y !== 0
        );
      } else {
        // Pan with mouse wheel
        e.preventDefault();
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [scale, position, setScale, setPosition, setIsViewModified]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Changed from ctrl to shift key
      e.preventDefault();
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastDistance.current = distance;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastDistance.current !== null) {
        const delta = distance - lastDistance.current;
        const newScale = Math.min(Math.max(0.1, scale + delta * 0.01), 5);
        setScale(newScale);
        setIsViewModified(
          newScale !== 1 || position.x !== 0 || position.y !== 0
        );
      }

      lastDistance.current = distance;
    } else if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const prevTouch = e.changedTouches[0];
      const newPosition = {
        x: position.x + (touch.clientX - prevTouch.clientX),
        y: position.y + (touch.clientY - prevTouch.clientY),
      };
      setPosition(newPosition);
      setIsViewModified(
        scale !== 1 || newPosition.x !== 0 || newPosition.y !== 0
      );
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsViewModified(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel]);

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Logo and Action Buttons */}
      <motion.div
        className="fixed top-6 left-0 right-0 px-6 z-[60] flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5"
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            <div className="absolute inset-[2px] rounded-[10px] bg-black/50 backdrop-blur-xl" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-white"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
          >
            Lumina
          </motion.div>
        </div>

        {/* Action Buttons */}
        {image && (
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={undo}
              className="select-none flex items-center gap-2 px-3 py-1.5 
                       bg-white/10 backdrop-blur-xl rounded-lg text-white/90 
                       hover:bg-blue-500/20 hover:text-blue-200 
                       transition-colors text-sm font-medium border border-white/5"
              title="Undo last change"
            >
              <FiRotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Undo</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFilters}
              className="select-none flex items-center gap-2 px-3 py-1.5 
                       bg-white/10 backdrop-blur-xl rounded-lg text-white/90 
                       hover:bg-red-500/20 hover:text-red-200 
                       transition-colors text-sm font-medium border border-white/5"
              title="Reset all filters"
            >
              <FiRefreshCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Reset</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageChange(file);
                };
                input.click();
              }}
              className="select-none flex items-center gap-2 px-3 py-1.5 
                       bg-white/10 backdrop-blur-xl rounded-lg text-white/90 
                       hover:bg-purple-500/20 hover:text-purple-200 
                       transition-colors text-sm font-medium border border-white/5"
              title="Change image"
            >
              <FiImage className="w-5 h-5" />
              <span className="hidden sm:inline">Change</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="select-none flex items-center gap-2 px-3 py-1.5 
                       bg-white/10 backdrop-blur-xl rounded-lg text-white/90 
                       hover:bg-green-500/20 hover:text-green-200 
                       transition-colors text-sm font-medium border border-white/5"
              title="Export image"
            >
              <FiDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 relative h-screen overflow-hidden">
        <motion.div ref={dragConstraintsRef} className="absolute inset-0">
          {image ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`relative w-full h-full flex items-center justify-center
                            transition-all duration-300 ease-in-out
                            ${
                              activeTab
                                ? "translate-y-[calc(-20vh+2rem)] sm:translate-y-0"
                                : ""
                            }`}
              >
                <div
                  ref={containerRef}
                  className="relative max-h-[60vh] sm:max-h-[80vh] max-w-[90vw] w-auto h-auto 
                           overflow-hidden rounded-xl transition-all duration-300 ease-in-out
                           cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <canvas
                    ref={canvasRef}
                    className="max-h-[60vh] sm:max-h-[80vh] max-w-[90vw] w-auto h-auto object-contain
                             transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                             scale-[0.85] sm:scale-100
                             sm:shadow-2xl"
                    style={{
                      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: "center",
                      touchAction: "none",
                    }}
                  />
                  {isViewModified && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={resetZoom}
                      className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 
                                 bg-black/50 backdrop-blur-xl rounded-full text-white/90 
                                 hover:bg-black/70 transition-colors border border-white/10
                                 flex items-center gap-2"
                      title="Reset Zoom"
                    >
                      <FiMaximize className="w-4 h-4" />
                      <span className="text-sm font-medium">Reset</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
              <div className="w-full h-full sm:h-[calc(100vh-160px)] flex items-center justify-center">
                <motion.div
                  className="relative flex flex-col items-center justify-center w-full max-w-xl p-8 
                           bg-[#1c1c1e]/80 backdrop-blur-xl rounded-2xl border border-white/10
                           hover:bg-[#1c1c1e]/90 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label className="cursor-pointer group w-full">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageChange(file);
                      }}
                      id="image-upload"
                    />
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-6 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
                        <FiImage className="w-16 h-16 text-white/90 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-200" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-white/90">
                          Upload an Image
                        </h3>
                        <p className="text-sm text-white/60">
                          Drop your image here or click to browse
                        </p>
                      </div>
                      <label
                        htmlFor="image-upload"
                        className="mt-6 px-6 py-3 bg-blue-500/20 backdrop-blur-xl rounded-lg 
                                 text-blue-200 hover:bg-blue-500/30 cursor-pointer
                                 transition-colors text-sm font-medium"
                      >
                        Choose Image
                      </label>
                    </div>
                  </label>
                </motion.div>
              </div>
            </div>
          )}

          {/* Draggable Feature Panel */}
          <AnimatePresence mode="wait">
            {activeTab && (
              <motion.div
                ref={panelRef}
                drag={window.innerWidth >= 640}
                dragListener={false}
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={dragConstraintsRef}
                initial={false}
                animate={
                  window.innerWidth >= 640
                    ? { x: panelPosition.x, y: panelPosition.y }
                    : { x: 0, y: 0 }
                }
                onDragEnd={(event, info) => {
                  if (window.innerWidth >= 640) {
                    const newX = Math.min(
                      window.innerWidth - 360,
                      Math.max(0, panelPosition.x + info.offset.x)
                    );
                    const newY = Math.min(
                      window.innerHeight - 400,
                      Math.max(0, panelPosition.y + info.offset.y)
                    );
                    setPanelPosition({
                      x: newX,
                      y: newY,
                    });
                  }
                }}
                className="fixed sm:relative bg-[#1c1c1e]/80 backdrop-blur-xl
                         rounded-t-2xl sm:rounded-2xl shadow-2xl min-w-[300px] sm:min-w-[360px] min-h-[400px]
                         w-full sm:w-auto max-w-full sm:max-w-[90vw] h-[450px] sm:max-h-[calc(100vh-40px)]
                         border-t sm:border border-white/10 resize-none sm:resize overflow-hidden
                         hover:ring-1 hover:ring-white/20 transition-colors
                         bottom-0 sm:bottom-auto left-0 sm:left-auto
                         sm:translate-x-0 sm:translate-y-0
                         z-[50] mt-[80px] sm:mt-0"
                style={{
                  width:
                    window.innerWidth < 640 ? "100%" : `${panelSize.width}px`,
                  height:
                    window.innerWidth < 640 ? "50vh" : `${panelSize.height}px`,
                  resize: window.innerWidth < 640 ? "none" : "both",
                  transform:
                    window.innerWidth < 640
                      ? "translateY(0)"
                      : `translate(${panelPosition.x}px, ${Math.min(
                          window.innerHeight - 400,
                          panelPosition.y
                        )}px)`,
                  touchAction: "none",
                }}
              >
                {/* Drag Handle for Mobile */}
                <div className="w-full flex justify-center sm:hidden pt-2">
                  <div className="w-12 h-1 rounded-full bg-white/20"></div>
                </div>

                {/* Panel Content */}
                <motion.div
                  className="sticky top-0 z-10 flex flex-col bg-[#1c1c1e]/90 backdrop-blur-2xl 
                             border-b border-white/10 mt-2 sm:mt-0"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-move
                               active:cursor-grabbing select-none"
                    onPointerDown={(e) => dragControls.start(e)}
                  >
                    <span className="font-medium flex items-center gap-2 text-white/90">
                      <FiMove className="hidden sm:block w-6 h-6 md:w-7 md:h-7 opacity-50 transition-all duration-300 hover:scale-110" />
                      {tabs.find((t) => t.id === activeTab)?.label}
                    </span>
                    <motion.button
                      whileHover={{
                        scale: 1.1,
                        backgroundColor: "rgba(255,255,255,0.1)",
                      }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveTab(null)}
                      className="p-2 rounded-full transition-colors"
                    >
                      <FiX className="w-6 h-6 md:w-7 md:h-7 text-white/90 transition-all duration-300 hover:scale-110" />
                    </motion.button>
                  </div>
                </motion.div>

                <div
                  className="p-6 pb-12 -mt-2 text-white/90 overflow-y-auto h-[calc(100%-104px)]
                               [&::-webkit-scrollbar]:w-2
                               [&::-webkit-scrollbar]:h-2
                               [&::-webkit-scrollbar-track]:bg-black/5
                               [&::-webkit-scrollbar-thumb]:bg-white/20
                               [&::-webkit-scrollbar-thumb]:rounded-full
                               [&::-webkit-scrollbar-thumb]:hover:bg-white/30
                               touch-pan-y select-none
                               [&_*]:select-none
                               space-y-6"
                >
                  {activeTab === "adjustments" && <Adjustments />}
                  {activeTab === "effects" && <Effects />}
                  {activeTab === "presets" && <Presets />}
                </div>

                {/* Resize Handles */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-1 cursor-ns-resize hover:bg-white/10"
                  onPointerDown={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (!target) return;

                    const startHeight = target.offsetHeight;
                    const startY = e.pageY;

                    const onPointerMove = (e: PointerEvent) => {
                      const delta = startY - e.pageY;
                      target.style.height = `${startHeight + delta}px`;
                    };

                    const onPointerUp = () => {
                      document.removeEventListener(
                        "pointermove",
                        onPointerMove
                      );
                      document.removeEventListener("pointerup", onPointerUp);
                    };

                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                  }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 w-1 cursor-ew-resize hover:bg-white/10"
                  onPointerDown={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (!target) return;

                    const startWidth = target.offsetWidth;
                    const startX = e.pageX;

                    const onPointerMove = (e: PointerEvent) => {
                      const delta = startX - e.pageX;
                      target.style.width = `${startWidth + delta}px`;
                    };

                    const onPointerUp = () => {
                      document.removeEventListener(
                        "pointermove",
                        onPointerMove
                      );
                      document.removeEventListener("pointerup", onPointerUp);
                    };

                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                  }}
                />
                <motion.div
                  className="absolute inset-y-0 right-0 w-2 cursor-ew-resize hover:bg-white/10 active:bg-white/20"
                  onPointerDown={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (!target) return;

                    const startWidth = target.offsetWidth;
                    const startX = e.pageX;

                    const onPointerMove = (e: PointerEvent) => {
                      e.preventDefault();
                      const delta = e.pageX - startX;
                      const newWidth = Math.max(360, startWidth + delta);
                      target.style.width = `${newWidth}px`;
                    };

                    const onPointerUp = () => {
                      document.removeEventListener(
                        "pointermove",
                        onPointerMove
                      );
                      document.removeEventListener("pointerup", onPointerUp);
                    };

                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                  }}
                />
                <motion.div
                  className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize hover:bg-white/10 active:bg-white/20"
                  onPointerDown={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (!target) return;

                    const startHeight = target.offsetHeight;
                    const startY = e.pageY;

                    const onPointerMove = (e: PointerEvent) => {
                      e.preventDefault();
                      const delta = e.pageY - startY;
                      const maxHeight = window.innerHeight - 100;
                      let newHeight = startHeight + delta;

                      // Prevent exceeding screen bounds
                      if (newHeight >= maxHeight) {
                        newHeight = maxHeight;
                        // Force stop dragging
                        document.removeEventListener(
                          "pointermove",
                          onPointerMove
                        );
                        document.removeEventListener("pointerup", onPointerUp);
                      } else {
                        // Keep height within minimum bounds
                        newHeight = Math.max(
                          400,
                          Math.min(maxHeight, newHeight)
                        );
                      }

                      target.style.height = `${newHeight}px`;
                      target.style.transition =
                        newHeight >= maxHeight
                          ? "height 0.3s ease-out"
                          : "none";
                    };

                    const onPointerUp = () => {
                      document.removeEventListener(
                        "pointermove",
                        onPointerMove
                      );
                      document.removeEventListener("pointerup", onPointerUp);
                    };

                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Fixed Bottom Menu */}
      {image && (
        <motion.div
          className="fixed bottom-0 inset-x-0 p-6 sm:p-4 bg-black/20 backdrop-blur-xl
                     border-t border-white/10 z-40"
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: [0.32, 0.72, 0, 1], // iOS easing
          }}
        >
          <motion.div
            className="flex justify-center flex-wrap gap-1.5 sm:gap-2 w-full px-1 sm:px-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-3 place-items-center sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto sm:justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    variants={buttonVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(isActive ? null : tab.id)}
                    className={`w-full sm:w-auto px-2 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-full font-medium 
                             text-sm sm:text-base md:text-lg
                             transition-all duration-200 flex flex-col sm:flex-row items-center 
                             justify-center sm:justify-start gap-1 sm:gap-3
                             ${
                               isActive
                                 ? "bg-white/20 backdrop-blur-xl text-white"
                                 : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                             }`}
                  >
                    <Icon className="w-7 h-7 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-300 group-hover:scale-110" />
                    <span className="hidden sm:inline text-sm md:text-base">
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md 
                       flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="bg-white/10 backdrop-blur-xl p-6 max-w-lg w-full
                       rounded-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white/90">
                  Export Image
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <FiX className="w-8 h-8 md:w-9 md:h-9 text-white/90 transition-all duration-300 hover:scale-110" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {["png", "jpeg", "webp"].map((format) => (
                  <motion.button
                    key={format}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      handleDownload(format as "png" | "jpeg" | "webp")
                    }
                    className="w-full py-4 px-5 md:py-5 md:px-6 bg-white/10 hover:bg-white/15
                             text-white/90 font-medium text-base md:text-lg rounded-xl
                             transition-colors duration-200
                             border border-white/20"
                  >
                    Download as {format.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
