import { create } from "zustand";
import { devtools } from "zustand/middleware";

let historyTimeout: NodeJS.Timeout;
const HISTORY_DEBOUNCE = 1000; // Increase debounce time for heavy filters

export type Filters = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  blur: number;
  hueRotate: number;
  invert: number;
  sepia: number;
  grayscale: number;
  opacity: number;
  temperature: number;
  tint: number;
  vibrance: number;
  highlights: number;
  shadows: number;
  sharpen: number;
  noise: number;
  pixelate: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  vignette: number;
  gamma: number;
  posterize: number;
  duotone: boolean;
  duotoneColors: Array<{
    r: number;
    g: number;
    b: number;
  }>;
  glow: number;
  glitter: number;
  glitterShape: "circle" | "star" | "diamond" | "square" | "heart";
  glitterColor: { r: number; g: number; b: number };
  glitterSize: number;
  glitterBlur: number;
  vhs: number;
  lightLeak: number;
  lightLeakColor: { r: number; g: number; b: number };
  lightLeakDirection: number;
  prismLight: number;
  distortion: number;
  distortionType:
    | "swirl"
    | "squeeze"
    | "wave"
    | "ripple"
    | "vortex"
    | "pixelate"
    | "twist"
    | "zigzag"
    | "spiral"
    | "bulge";
  distortionIntensity: number;
  glitch: number;
  glitchIntensity: number;
  glitchSpeed: number;
  scanlines: number;
  rgbShift: number;
  oldFilm: number;
  glowRadius: number;
  glowIntensity: number;
  lightLeakIntensity: number;
  prismLightAngle: number;
  prismLightSpread: number;
};

interface HistoryState {
  filters: Filters;
  timestamp: number;
}

interface ImageState {
  image: string | null;
  filters: Filters;
  history: HistoryState[];
  currentHistoryIndex: number;
  resetFilters: () => void;
  setImage: (image: string | null) => void;
  updateFilter: <K extends keyof Filters>(filter: K, value: Filters[K]) => void;
  undo: () => void;
}

export const defaultFilters: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 100,
  blur: 0,
  hueRotate: 0,
  invert: 0,
  sepia: 0,
  grayscale: 0,
  opacity: 100,
  temperature: 0,
  tint: 0,
  vibrance: 100,
  highlights: 0,
  shadows: 0,
  sharpen: 0,
  noise: 0,
  pixelate: 0,
  flipHorizontal: false,
  flipVertical: false,
  vignette: 0,
  gamma: 1,
  posterize: 0,
  duotone: false,
  duotoneColors: [
    { r: 34, g: 34, b: 34 },
    { r: 255, g: 255, b: 255 },
  ],
  glow: 0,
  glitter: 0,
  glitterShape: "circle",
  glitterColor: { r: 255, g: 255, b: 255 },
  glitterSize: 3,
  glitterBlur: 0.5,
  vhs: 0,
  lightLeak: 0,
  lightLeakColor: { r: 255, g: 150, b: 50 },
  lightLeakDirection: 45,
  prismLight: 0,
  distortion: 0,
  distortionType: "swirl",
  distortionIntensity: 50,
  glitch: 0,
  glitchIntensity: 50,
  glitchSpeed: 50,
  scanlines: 0,
  rgbShift: 0,
  oldFilm: 0,
  glowRadius: 0,
  glowIntensity: 0,
  lightLeakIntensity: 0,
  prismLightAngle: 0,
  prismLightSpread: 0,
};

// Separate update logic for heavy filters
const isHeavyFilter = (filter: keyof Filters): boolean => {
  return ["gamma", "posterize", "duotone", "vignette"].includes(filter);
};

export const useImageStore = create<ImageState>()(
  devtools((set, get) => ({
    image: null,
    filters: { ...defaultFilters },
    history: [],
    currentHistoryIndex: -1,

    resetFilters: () => {
      if (historyTimeout) {
        clearTimeout(historyTimeout);
      }
      set({
        filters: { ...defaultFilters },
        history: [],
        currentHistoryIndex: -1,
      });
    },

    setImage: (image) => {
      if (historyTimeout) {
        clearTimeout(historyTimeout);
      }
      set({
        image,
        filters: { ...defaultFilters },
        history: [],
        currentHistoryIndex: -1,
      });
    },

    updateFilter: (filter, value) =>
      set((state) => {
        // Create new filters state
        const newFilters = {
          ...state.filters,
          [filter]: value,
        };

        // Clear any existing timeout
        if (historyTimeout) {
          clearTimeout(historyTimeout);
        }

        // Use longer debounce time for heavy filters
        const debounceTime = isHeavyFilter(filter) ? HISTORY_DEBOUNCE : 500;

        // Set a new timeout to add to history
        historyTimeout = setTimeout(() => {
          const currentState = get();

          // Remove any future history states if we're not at the latest point
          const newHistory = currentState.history.slice(
            0,
            currentState.currentHistoryIndex + 1
          );

          // Add current state to history
          const historyEntry: HistoryState = {
            filters: { ...currentState.filters },
            timestamp: Date.now(),
          };

          set({
            history: [...newHistory, historyEntry],
            currentHistoryIndex: newHistory.length,
          });
        }, debounceTime);

        return {
          filters: newFilters,
        };
      }),

    undo: () =>
      set((state) => {
        if (state.currentHistoryIndex < 0 || state.history.length === 0) {
          return state;
        }

        if (historyTimeout) {
          clearTimeout(historyTimeout);
        }

        const previousIndex = state.currentHistoryIndex - 1;
        const previousState =
          previousIndex >= 0 ? state.history[previousIndex] : null;

        if (previousState) {
          return {
            filters: { ...previousState.filters },
            currentHistoryIndex: previousIndex,
          };
        }

        return {
          filters: { ...defaultFilters },
          currentHistoryIndex: -1,
        };
      }),
  }))
);
