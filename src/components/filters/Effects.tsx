"use client";

import { useImageStore, Filters } from "@/store/imageStore";
import Slider from "@/components/ui/Slider";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { rgbToHex, hexToRgb } from "@/utils/colorUtils";
import { useState, useRef } from "react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { FiDroplet, FiClock, FiZap, FiSliders, FiX } from "react-icons/fi";

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

const duotonePresets = [
  {
    name: "Noir",
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ],
  },
  {
    name: "Azure",
    colors: [
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 255 },
    ],
  },
  {
    name: "Sunset",
    colors: [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 255, b: 0 },
    ],
  },
  {
    name: "Forest",
    colors: [
      { r: 0, g: 100, b: 0 },
      { r: 200, g: 255, b: 200 },
    ],
  },
];

export const ColorPickerPopup = ({
  color,
  onChange,
  title,
  isOpen,
  onClose,
  containerRef,
  parentRect,
}: {
  color: string;
  onChange: (color: string) => void;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  parentRect: DOMRect | null;
}) => {
  const [hexInput, setHexInput] = useState(color);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  if (!isOpen || !parentRect) return null;

  return (
    <div
      className="absolute z-50 top-full left-0 right-0 mt-2"
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 bg-[#1c1c1e]/95 rounded-lg border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/90 font-medium">{title}</span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors"
            aria-label="Close color picker"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="relative space-y-4">
          <HexColorPicker
            color={color}
            onChange={onChange}
            style={{ width: "100%" }}
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/90">Hex:</span>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              className="bg-white/10 rounded px-2 py-1 text-sm text-white/90 w-24"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Effects() {
  const { filters, updateFilter } = useImageStore();
  const [showDarkColorPicker, setShowDarkColorPicker] = useState(false);
  const [showLightColorPicker, setShowLightColorPicker] = useState(false);
  const [showGlitterPicker, setShowGlitterPicker] = useState(false);
  const [showLightLeakPicker, setShowLightLeakPicker] = useState(false);
  const [darkColorHex, setDarkColorHex] = useState(
    rgbToHex(filters.duotoneColors[0])
  );
  const [lightColorHex, setLightColorHex] = useState(
    rgbToHex(filters.duotoneColors[1])
  );

  const darkPickerRef = useRef<HTMLDivElement>(null);
  const lightPickerRef = useRef<HTMLDivElement>(null);
  const glitterPickerRef = useRef<HTMLDivElement>(null);
  const lightLeakPickerRef = useRef<HTMLDivElement>(null);

  const darkButtonRef = useRef<HTMLButtonElement>(null);
  const lightButtonRef = useRef<HTMLButtonElement>(null);
  const glitterButtonRef = useRef<HTMLButtonElement>(null);
  const lightLeakButtonRef = useRef<HTMLButtonElement>(null);

  const [colorPickerRects, setColorPickerRects] = useState<{
    [key: string]: DOMRect | null;
  }>({});

  useOnClickOutside(darkPickerRef, () => setShowDarkColorPicker(false));
  useOnClickOutside(lightPickerRef, () => setShowLightColorPicker(false));
  useOnClickOutside(glitterPickerRef, () => setShowGlitterPicker(false));
  useOnClickOutside(lightLeakPickerRef, () => setShowLightLeakPicker(false));

  const handleDarkColorChange = (color: string) => {
    setDarkColorHex(color);
    const rgb = hexToRgb(color);
    const newColors = [...filters.duotoneColors];
    newColors[0] = rgb;
    updateFilter("duotoneColors", newColors);
  };

  const handleLightColorChange = (color: string) => {
    setLightColorHex(color);
    const rgb = hexToRgb(color);
    const newColors = [...filters.duotoneColors];
    newColors[1] = rgb;
    updateFilter("duotoneColors", newColors);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-md mx-auto"
    >
      {/* Basic Effects */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <FiSliders className="w-6 h-6 text-white/90" />
          <h3 className="text-lg font-bold text-white/90">Basic Effects</h3>
        </div>
        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-black/20">
          <Slider
            label="Blur"
            value={filters.blur}
            onChange={(value) => updateFilter("blur", value)}
            min={0}
            max={100}
            step={1}
            aria-label="Image blur amount"
          />
          <Slider
            label="Sharpen"
            value={filters.sharpen}
            onChange={(value) => updateFilter("sharpen", value)}
            min={0}
            max={100}
            step={1}
            aria-label="Image sharpness"
          />
          <Slider
            label="Noise"
            value={filters.noise}
            onChange={(value) => updateFilter("noise", value)}
            min={0}
            max={100}
            step={1}
            aria-label="Image noise amount"
          />
          <Slider
            label="Vignette"
            value={filters.vignette}
            onChange={(value) => updateFilter("vignette", value)}
            min={0}
            max={100}
            step={1}
            aria-label="Vignette effect intensity"
          />
          <Slider
            label="Pixelate"
            value={filters.pixelate}
            onChange={(value) => updateFilter("pixelate", value)}
            min={0}
            max={100}
            step={1}
            aria-label="Pixelation amount"
          />
          <Slider
            label="Posterize"
            value={filters.posterize}
            onChange={(value) => updateFilter("posterize", value)}
            min={0}
            max={20}
            step={1}
            aria-label="Posterize effect levels"
          />
        </div>
      </section>

      {/* Retro Effects */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <FiClock className="w-6 h-6 text-white/90" />
          <h3 className="text-lg font-bold text-white/90">Retro Effects</h3>
        </div>
        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-black/20">
          <div className="space-y-4">
            <Slider
              label="VHS Effect"
              value={filters.vhs}
              onChange={(value) => updateFilter("vhs", value)}
              min={0}
              max={100}
              step={1}
            />
            <Slider
              label="Scanlines"
              value={filters.scanlines}
              onChange={(value) => updateFilter("scanlines", value)}
              min={0}
              max={100}
              step={1}
            />
            <Slider
              label="RGB Shift"
              value={filters.rgbShift}
              onChange={(value) => updateFilter("rgbShift", value)}
              min={0}
              max={100}
              step={1}
            />
            <Slider
              label="Old Film"
              value={filters.oldFilm}
              onChange={(value) => updateFilter("oldFilm", value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </section>

      {/* Creative Effects */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <FiZap className="w-6 h-6 text-white/90" />
          <h3 className="text-lg font-bold text-white/90">Creative Effects</h3>
        </div>
        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-black/20">
          <div>
            <Slider
              label="Glitter"
              value={filters.glitter}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("glitter", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Glitter amount"
            />
            {filters.glitter > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="relative w-full">
                    <select
                      value={filters.glitterShape}
                      onChange={(e) =>
                        updateFilter(
                          "glitterShape",
                          e.target.value as Filters["glitterShape"]
                        )
                      }
                      className="w-full h-10 bg-[#1c1c1e]/80 text-white/90 rounded-lg px-3 text-sm border border-white/20 hover:bg-[#1c1c1e]/60 transition-colors"
                      aria-label="Select glitter shape"
                    >
                      <option value="circle">Circle</option>
                      <option value="star">Star</option>
                      <option value="diamond">Diamond</option>
                      <option value="square">Square</option>
                      <option value="heart">Heart</option>
                    </select>
                  </div>
                  <div className="relative w-full">
                    <button
                      ref={glitterButtonRef}
                      onClick={() => {
                        if (glitterButtonRef.current) {
                          const rect =
                            glitterButtonRef.current.getBoundingClientRect();
                          setColorPickerRects((prev) => ({
                            ...prev,
                            glitter: rect,
                          }));
                          setShowGlitterPicker(true);
                        }
                      }}
                      className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                      style={{
                        backgroundColor: rgbToHex(filters.glitterColor),
                      }}
                      aria-label="Choose glitter color"
                    >
                      <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                        Glitter Color
                      </span>
                    </button>
                    <div className="absolute w-[calc(200%+1rem)] right-0 z-50">
                      {showGlitterPicker && (
                        <ColorPickerPopup
                          color={rgbToHex(filters.glitterColor)}
                          onChange={(color) =>
                            updateFilter("glitterColor", hexToRgb(color))
                          }
                          title="Glitter Color"
                          isOpen={showGlitterPicker}
                          onClose={() => setShowGlitterPicker(false)}
                          containerRef={glitterPickerRef}
                          parentRect={colorPickerRects["glitter"]}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <Slider
                  label="Size"
                  value={filters.glitterSize}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("glitterSize", value);
                    });
                  }}
                  min={1}
                  max={20}
                  step={0.5}
                  aria-label="Glitter size"
                />
                <Slider
                  label="Blur"
                  value={filters.glitterBlur}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("glitterBlur", value);
                    });
                  }}
                  min={0}
                  max={10}
                  step={0.1}
                  aria-label="Glitter blur"
                />
              </div>
            )}
          </div>

          <div>
            <Slider
              label="Distortion"
              value={filters.distortion}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("distortion", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Distortion amount"
            />
            {filters.distortion > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <select
                  value={filters.distortionType}
                  onChange={(e) =>
                    updateFilter(
                      "distortionType",
                      e.target.value as Filters["distortionType"]
                    )
                  }
                  className="w-full bg-[#1c1c1e]/80 text-white/90 rounded-lg px-3 py-2 text-sm border border-white/20 hover:bg-[#1c1c1e]/60 transition-colors"
                  aria-label="Select distortion type"
                >
                  <option value="swirl">Swirl</option>
                  <option value="squeeze">Squeeze</option>
                  <option value="wave">Wave</option>
                  <option value="ripple">Ripple</option>
                  <option value="vortex">Vortex</option>
                  <option value="pixelate">Pixelate Distort</option>
                  <option value="twist">Twist</option>
                  <option value="zigzag">Zigzag</option>
                  <option value="spiral">Spiral</option>
                  <option value="bulge">Bulge</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <Slider
              label="Glitch"
              value={filters.glitch}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("glitch", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Glitch amount"
            />
            {filters.glitch > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <Slider
                  label="Intensity"
                  value={filters.glitchIntensity}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("glitchIntensity", value);
                    });
                  }}
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Glitch intensity"
                />
                <Slider
                  label="Speed"
                  value={filters.glitchSpeed}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("glitchSpeed", value);
                    });
                  }}
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Glitch speed"
                />
              </div>
            )}
          </div>

          {/* Light Effects */}
          <div>
            <Slider
              label="Glow"
              value={filters.glow}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("glow", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Glow amount"
            />
            {filters.glow > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <Slider
                  label="Radius"
                  value={filters.glowRadius}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("glowRadius", value);
                    });
                  }}
                  min={0}
                  max={50}
                  step={1}
                  aria-label="Glow radius"
                />
              </div>
            )}
          </div>

          <div>
            <Slider
              label="Light Leak"
              value={filters.lightLeak}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("lightLeak", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Light leak amount"
            />
            {filters.lightLeak > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <div className="relative w-full mb-2">
                  <button
                    ref={lightLeakButtonRef}
                    onClick={() => {
                      if (lightLeakButtonRef.current) {
                        const rect =
                          lightLeakButtonRef.current.getBoundingClientRect();
                        setColorPickerRects((prev) => ({
                          ...prev,
                          lightLeak: rect,
                        }));
                        setShowLightLeakPicker(true);
                      }
                    }}
                    className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{
                      backgroundColor: rgbToHex(filters.lightLeakColor),
                    }}
                    aria-label="Choose light leak color"
                  >
                    <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                      Light Leak Color
                    </span>
                  </button>
                  <div className="absolute w-full z-50">
                    {showLightLeakPicker && (
                      <ColorPickerPopup
                        color={rgbToHex(filters.lightLeakColor)}
                        onChange={(color) =>
                          updateFilter("lightLeakColor", hexToRgb(color))
                        }
                        title="Light Leak Color"
                        isOpen={showLightLeakPicker}
                        onClose={() => setShowLightLeakPicker(false)}
                        containerRef={lightLeakPickerRef}
                        parentRect={colorPickerRects["lightLeak"]}
                      />
                    )}
                  </div>
                </div>
                <Slider
                  label="Direction"
                  value={filters.lightLeakDirection}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("lightLeakDirection", value);
                    });
                  }}
                  min={0}
                  max={360}
                  step={1}
                  aria-label="Light leak direction"
                />
              </div>
            )}
          </div>

          <div>
            <Slider
              label="Prism Light"
              value={filters.prismLight}
              onChange={(value) => {
                requestAnimationFrame(() => {
                  updateFilter("prismLight", value);
                });
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Prism light amount"
            />
            {filters.prismLight > 0 && (
              <div className="space-y-2 mt-2 p-3 rounded-xl bg-[#1c1c1e]/40 border border-white/5">
                <Slider
                  label="Angle"
                  value={filters.prismLightAngle}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("prismLightAngle", value);
                    });
                  }}
                  min={0}
                  max={360}
                  step={1}
                  aria-label="Prism light angle"
                />
                <Slider
                  label="Spread"
                  value={filters.prismLightSpread}
                  onChange={(value) => {
                    requestAnimationFrame(() => {
                      updateFilter("prismLightSpread", value);
                    });
                  }}
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Prism light spread"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Color Effects */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <FiDroplet className="w-6 h-6 text-white/90" />
          <h3 className="text-lg font-bold text-white/90">Color Effects</h3>
        </div>
        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">Duotone</span>
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

          {filters.duotone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative w-full">
                  <button
                    ref={darkButtonRef}
                    onClick={() => {
                      if (darkButtonRef.current) {
                        const rect =
                          darkButtonRef.current.getBoundingClientRect();
                        setColorPickerRects((prev) => ({
                          ...prev,
                          dark: rect,
                        }));
                        setShowDarkColorPicker(true);
                      }
                    }}
                    className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{ backgroundColor: darkColorHex }}
                    aria-label="Choose dark color"
                  >
                    <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                      Dark Color
                    </span>
                  </button>
                  <div className="absolute w-[calc(200%+1rem)] z-50">
                    {showDarkColorPicker && (
                      <ColorPickerPopup
                        color={darkColorHex}
                        onChange={(color) => {
                          handleDarkColorChange(color);
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
                        const rect =
                          lightButtonRef.current.getBoundingClientRect();
                        setColorPickerRects((prev) => ({
                          ...prev,
                          light: rect,
                        }));
                        setShowLightColorPicker(true);
                      }
                    }}
                    className="w-full h-10 rounded-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{ backgroundColor: lightColorHex }}
                    aria-label="Choose light color"
                  >
                    <span className="text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white font-medium z-10">
                      Light Color
                    </span>
                  </button>
                  <div className="absolute w-[calc(200%+1rem)] right-0 z-50">
                    {showLightColorPicker && (
                      <ColorPickerPopup
                        color={lightColorHex}
                        onChange={(color) => {
                          handleLightColorChange(color);
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
              </div>
              <div className="grid grid-cols-2 gap-2">
                {duotonePresets.map((preset) => (
                  <motion.button
                    key={preset.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      updateFilter("duotoneColors", preset.colors);
                      setDarkColorHex(rgbToHex(preset.colors[0]));
                      setLightColorHex(rgbToHex(preset.colors[1]));
                    }}
                    className="p-3 rounded-xl font-medium text-sm bg-[#1c1c1e]/80 backdrop-blur-xl text-white/90 hover:bg-[#1c1c1e]/60 transition-all"
                  >
                    {preset.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <Slider
            label="Hue Rotate"
            value={filters.hueRotate}
            onChange={(value) => updateFilter("hueRotate", value)}
            min={0}
            max={360}
            step={1}
            aria-label="Hue rotation"
          />
        </div>
      </section>
    </motion.div>
  );
}
