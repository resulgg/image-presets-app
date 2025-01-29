"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useImageStore } from "@/store/imageStore";
import Slider from "@/components/ui/Slider";

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

export default function BasicFilters() {
  // Separate selectors to prevent unnecessary re-renders
  const filters = useImageStore(useCallback((state) => state.filters, []));
  const updateFilter = useImageStore(
    useCallback((state) => state.updateFilter, [])
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Slider
        label="Brightness"
        value={filters.brightness}
        onChange={(value) => updateFilter("brightness", value)}
        min={0}
        max={200}
      />

      <Slider
        label="Contrast"
        value={filters.contrast}
        onChange={(value) => updateFilter("contrast", value)}
        min={0}
        max={200}
      />

      <Slider
        label="Saturation"
        value={filters.saturation}
        onChange={(value) => updateFilter("saturation", value)}
        min={0}
        max={200}
      />

      <Slider
        label="Temperature"
        value={filters.temperature}
        onChange={(value) => updateFilter("temperature", value)}
        min={-100}
        max={100}
      />

      <Slider
        label="Exposure"
        value={filters.exposure}
        onChange={(value) => updateFilter("exposure", value)}
        min={0}
        max={200}
      />
    </motion.div>
  );
}
