import { useViewStore } from "@/store/viewStore";
import Slider from "@/components/ui/Slider";

export default function MobileControls() {
  const { scale, position, handleZoom, handlePan, resetView } = useViewStore();

  // Format zoom value to integer percentage

  return (
    <div className="space-y-6">
      {/* Zoom Control */}
      <div className="space-y-2">
        <Slider
          label="Zoom"
          value={Number(scale.toFixed(1))}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(value: number) => {
            const delta = value - scale;
            console.log(delta);
            handleZoom(delta * 10);
          }}
        />
      </div>

      {/* Pan X Control */}
      <div className="space-y-2">
        <Slider
          label="Pan Horizontal"
          value={position.x}
          min={-200}
          max={200}
          step={1}
          onChange={(value: number) => {
            const delta = value - position.x;
            handlePan(-delta, 0);
          }}
        />
      </div>

      {/* Pan Y Control */}
      <div className="space-y-2">
        <Slider
          label="Pan Vertical"
          value={position.y}
          min={-200}
          max={200}
          step={1}
          onChange={(value: number) => {
            const delta = value - position.y;
            handlePan(0, -delta);
          }}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={resetView}
        className="w-full py-2 px-4 bg-white/10 rounded-lg text-white/90 
                 hover:bg-white/20 transition-colors text-sm font-medium"
      >
        Reset View
      </button>
    </div>
  );
}
