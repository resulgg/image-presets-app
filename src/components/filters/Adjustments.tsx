"use client";

import { useImageStore } from "@/store/imageStore";
import Slider from "@/components/ui/Slider";
import { motion } from "framer-motion";

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

export default function Adjustments() {
  const { filters, updateFilter } = useImageStore();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="space-y-4">
        <Slider
          label="Brightness"
          value={filters.brightness}
          onChange={(value) => updateFilter("brightness", value)}
          min={0}
          max={200}
          step={1}
        />
        <Slider
          label="Contrast"
          value={filters.contrast}
          onChange={(value) => updateFilter("contrast", value)}
          min={0}
          max={200}
          step={1}
        />
        <Slider
          label="Saturation"
          value={filters.saturation}
          onChange={(value) => updateFilter("saturation", value)}
          min={0}
          max={200}
          step={1}
        />
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
          label="Vibrance"
          value={filters.vibrance}
          onChange={(value) => updateFilter("vibrance", value)}
          min={0}
          max={200}
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
          label="Gamma"
          value={filters.gamma}
          onChange={(value) => updateFilter("gamma", value)}
          min={0.1}
          max={2.2}
          step={0.1}
        />
      </div>
    </motion.div>
  );
}
