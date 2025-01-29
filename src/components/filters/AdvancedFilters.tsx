"use client";

import { useImageStore } from "@/store/imageStore";
import Slider from "@/components/ui/Slider";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { rgbToHex, hexToRgb } from "@/utils/colorUtils";
import { ColorPickerPopup } from "./Effects";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

export default function AdvancedFilters() {
  const { filters, updateFilter } = useImageStore();
  const [showDarkColorPicker, setShowDarkColorPicker] = useState(false);
  const [showLightColorPicker, setShowLightColorPicker] = useState(false);
  const darkPickerRef = useRef<HTMLDivElement>(null);
  const lightPickerRef = useRef<HTMLDivElement>(null);
  const darkButtonRef = useRef<HTMLButtonElement>(null);
  const lightButtonRef = useRef<HTMLButtonElement>(null);
  const [colorPickerRects, setColorPickerRects] = useState<{
    [key: string]: DOMRect | null;
  }>({});

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Slider
        label="Exposure"
        value={filters.exposure}
        onChange={(value) => updateFilter("exposure", value)}
        min={0}
        max={200}
        step={1}
      />
      <Slider
        label="Temperature"
        value={filters.temperature}
        onChange={(value) => updateFilter("temperature", value)}
        min={-100}
        max={100}
        step={1}
      />
      <Slider
        label="Tint"
        value={filters.tint}
        onChange={(value) => updateFilter("tint", value)}
        min={-100}
        max={100}
        step={1}
      />
      <Slider
        label="Highlights"
        value={filters.highlights}
        onChange={(value) => updateFilter("highlights", value)}
        min={-100}
        max={100}
        step={1}
      />
      <Slider
        label="Shadows"
        value={filters.shadows}
        onChange={(value) => updateFilter("shadows", value)}
        min={-100}
        max={100}
        step={1}
      />
      <Slider
        label="Vibrance"
        value={filters.vibrance}
        onChange={(value) => updateFilter("vibrance", value)}
        min={0}
        max={200}
        step={1}
      />
      <Slider
        label="Vignette"
        value={filters.vignette}
        onChange={(value) => updateFilter("vignette", value)}
        min={0}
        max={100}
        step={1}
      />
      <Slider
        label="Gamma"
        value={filters.gamma}
        onChange={(value) => updateFilter("gamma", value)}
        min={0.1}
        max={2.2}
        step={0.1}
      />
      <Slider
        label="Posterize"
        value={filters.posterize}
        onChange={(value) => updateFilter("posterize", value)}
        min={0}
        max={20}
        step={1}
      />
      <div className="space-y-2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between px-4 py-3 bg-[#1c1c1e]/80 rounded-xl"
        >
          <label className="text-[17px] font-medium text-white/90">
            Duotone
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filters.duotone}
              onChange={(e) => updateFilter("duotone", e.target.checked)}
              className="relative h-[31px] w-[51px] cursor-pointer appearance-none rounded-full bg-[#39393b] 
                         transition-colors duration-200 ease-in-out
                         before:absolute before:left-[2px] before:top-[2px]
                         before:h-[27px] before:w-[27px] before:rounded-full 
                         before:bg-white before:shadow before:transition-transform
                         checked:bg-blue-500 checked:before:translate-x-[20px]"
            />
          </div>
        </motion.div>

        {filters.duotone && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 px-4 py-3 bg-[#1c1c1e]/80 rounded-xl"
          >
            <div className="relative w-full">
              <button
                ref={darkButtonRef}
                onClick={() => {
                  if (darkButtonRef.current) {
                    const rect = darkButtonRef.current.getBoundingClientRect();
                    setColorPickerRects((prev) => ({
                      ...prev,
                      dark: rect,
                    }));
                    setShowDarkColorPicker(true);
                  }
                }}
                className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                style={{ backgroundColor: rgbToHex(filters.duotoneColors[0]) }}
                aria-label="Choose dark color"
              >
                <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                  Dark Color
                </span>
              </button>
              <div className="absolute w-[calc(200%+1rem)] z-50">
                {showDarkColorPicker && (
                  <ColorPickerPopup
                    color={rgbToHex(filters.duotoneColors[0])}
                    onChange={(color: string) => {
                      const rgb = hexToRgb(color);
                      const newColors = [...filters.duotoneColors];
                      newColors[0] = rgb;
                      updateFilter("duotoneColors", newColors);
                    }}
                    title="Dark Color"
                    isOpen={showDarkColorPicker}
                    onClose={() => setShowDarkColorPicker(false)}
                    containerRef={darkPickerRef}
                    parentRect={colorPickerRects["dark"]}
                  />
                )}
              </div>
            </div>

            <div className="relative w-full">
              <button
                ref={lightButtonRef}
                onClick={() => {
                  if (lightButtonRef.current) {
                    const rect = lightButtonRef.current.getBoundingClientRect();
                    setColorPickerRects((prev) => ({
                      ...prev,
                      light: rect,
                    }));
                    setShowLightColorPicker(true);
                  }
                }}
                className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                style={{ backgroundColor: rgbToHex(filters.duotoneColors[1]) }}
                aria-label="Choose light color"
              >
                <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                  Light Color
                </span>
              </button>
              <div className="absolute w-[calc(200%+1rem)] right-0 z-50">
                {showLightColorPicker && (
                  <ColorPickerPopup
                    color={rgbToHex(filters.duotoneColors[1])}
                    onChange={(color: string) => {
                      const rgb = hexToRgb(color);
                      const newColors = [...filters.duotoneColors];
                      newColors[1] = rgb;
                      updateFilter("duotoneColors", newColors);
                    }}
                    title="Light Color"
                    isOpen={showLightColorPicker}
                    onClose={() => setShowLightColorPicker(false)}
                    containerRef={lightPickerRef}
                    parentRect={colorPickerRects["light"]}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
