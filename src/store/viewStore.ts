import { create } from "zustand";

interface ViewState {
  scale: number;
  position: { x: number; y: number };
  isViewModified: boolean;
  isDragging: boolean;
  isPinching: boolean;
  startPos: { x: number; y: number };
  initialPinchDistance: number | null;
  lastPinchScale: number;

  // Actions
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setIsViewModified: (isModified: boolean) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsPinching: (isPinching: boolean) => void;
  setStartPos: (position: { x: number; y: number }) => void;
  setInitialPinchDistance: (distance: number | null) => void;
  setLastPinchScale: (scale: number) => void;

  // Complex actions
  resetView: () => void;
  handleZoom: (delta: number, center?: { x: number; y: number }) => void;
  handlePan: (deltaX: number, deltaY: number) => void;
  checkBounds: (containerRect: DOMRect) => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  isViewModified: false,
  isDragging: false,
  isPinching: false,
  startPos: { x: 0, y: 0 },
  initialPinchDistance: null,
  lastPinchScale: 1,

  // Basic setters
  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setIsViewModified: (isModified) => set({ isViewModified: isModified }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsPinching: (isPinching) => set({ isPinching }),
  setStartPos: (position) => set({ startPos: position }),
  setInitialPinchDistance: (distance) =>
    set({ initialPinchDistance: distance }),
  setLastPinchScale: (scale) => set({ lastPinchScale: scale }),

  // Complex actions
  resetView: () => {
    set({
      scale: 1,
      position: { x: 0, y: 0 },
      isViewModified: false,
      isDragging: false,
      isPinching: false,
      initialPinchDistance: null,
      lastPinchScale: 1,
    });
  },

  handleZoom: (delta: number, center?: { x: number; y: number }) => {
    const state = get();
    const zoomFactor = 0.1;
    const newScale = Math.min(
      Math.max(0.1, state.scale + (delta > 0 ? zoomFactor : -zoomFactor)),
      5
    );

    if (center) {
      // Adjust position to keep the zoom center point stable
      const scaleChange = newScale - state.scale;
      set({
        position: {
          x: state.position.x - center.x * scaleChange,
          y: state.position.y - center.y * scaleChange,
        },
      });
    }

    set({
      scale: newScale,
      isViewModified:
        newScale !== 1 || state.position.x !== 0 || state.position.y !== 0,
    });
  },

  handlePan: (deltaX: number, deltaY: number) => {
    set((state) => ({
      position: {
        x: state.position.x - deltaX,
        y: state.position.y - deltaY,
      },
      isViewModified: true,
    }));
  },

  checkBounds: (containerRect: DOMRect) => {
    const state = get();
    const imageWidth = containerRect.width * state.scale;
    const imageHeight = containerRect.height * state.scale;

    const maxX = Math.max(0, (imageWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (imageHeight - containerRect.height) / 2);

    const boundedPosition = {
      x: Math.min(Math.max(state.position.x, -maxX), maxX),
      y: Math.min(Math.max(state.position.y, -maxY), maxY),
    };

    if (
      boundedPosition.x !== state.position.x ||
      boundedPosition.y !== state.position.y
    ) {
      set({ position: boundedPosition });
    }

    // Bounce back animation if image is smaller than container
    if (state.scale < 1) {
      set({
        scale: 1,
        position: { x: 0, y: 0 },
      });
    }
  },
}));
