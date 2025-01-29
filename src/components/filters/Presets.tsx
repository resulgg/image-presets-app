"use client";

import { motion } from "framer-motion";
import { useImageStore, type Filters } from "@/store/imageStore";
import { presets, type Preset } from "@/constants/presets";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useState } from "react";

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

export default function Presets() {
  const updateFilter = useImageStore((state) => state.updateFilter);
  const resetFilters = useImageStore((state) => state.resetFilters);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const applyPreset = (preset: Preset) => {
    resetFilters();
    Object.entries(preset.filters).forEach(([key, value]) => {
      updateFilter(key as keyof Filters, value);
    });
    setSelectedPreset(preset.name);
  };

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
        <div key={category} className="space-y-2">
          <motion.button
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full flex items-center justify-between p-3 bg-white/5 
                       backdrop-blur-xl rounded-xl text-white/90 font-medium
                       hover:bg-white/10 transition-colors"
            onClick={() => toggleCategory(category)}
          >
            <span>{category}</span>
            {expandedCategories.includes(category) ? (
              <FiChevronDown className="w-5 h-5" />
            ) : (
              <FiChevronRight className="w-5 h-5" />
            )}
          </motion.button>

          {expandedCategories.includes(category) && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 pl-2"
            >
              {categoryPresets.map((preset) => (
                <motion.button
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  key={preset.name}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className={`w-full p-4 rounded-xl text-left transition-all
                              ${
                                selectedPreset === preset.name
                                  ? "bg-white/20 ring-2 ring-blue-400/50 scale-[1.02] border-blue-400/30"
                                  : "bg-white/5 hover:bg-white/10 border-white/10"
                              }
                              border`}
                >
                  <div
                    className={`font-medium mb-1 ${
                      selectedPreset === preset.name
                        ? "text-white"
                        : "text-white/90"
                    }`}
                  >
                    {preset.name}
                  </div>
                  <div className="text-sm text-white/50">
                    {preset.description}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
