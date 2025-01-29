"use client";

import { motion } from "framer-motion";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: SliderProps) {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex justify-between items-center">
        <motion.span
          className="font-medium text-sm text-white/90"
          whileHover={{ scale: 1.02 }}
        >
          {label}
        </motion.span>
        <motion.div
          className="text-sm px-2 py-0.5 bg-white/10 backdrop-blur-xl
                   rounded-md text-white/90 min-w-[40px] text-center"
          initial={false}
          animate={{
            scale: [1, 1.1, 1],
            transition: { duration: 0.2 },
          }}
        >
          {value}
        </motion.div>
      </div>
      <div className="relative px-[10px] py-2">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center px-[10px]">
          <div className="h-[2px] w-full bg-white/10 rounded-full" />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-5 appearance-none cursor-pointer bg-transparent
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]
                   [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:duration-200
                   [&::-webkit-slider-thumb]:hover:scale-110
                   [&::-webkit-slider-thumb]:active:scale-95
                   [&::-moz-range-thumb]:appearance-none 
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-white
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]
                   [&::-moz-range-thumb]:transition-transform
                   [&::-moz-range-thumb]:duration-200
                   [&::-moz-range-thumb]:hover:scale-110
                   [&::-moz-range-thumb]:active:scale-95"
        />
      </div>
    </motion.div>
  );
}
