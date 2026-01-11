/**
 * Zoom control buttons for the concept graph.
 */

import * as d3 from "d3";

interface ZoomControlsProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function ZoomControls({ svgRef }: ZoomControlsProps) {
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(200).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.3
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(200).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        0.7
      );
    }
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 rounded-full bg-[var(--lo1-void)] border border-[var(--lo1-celestial)]/30
                   text-[var(--lo1-starlight)] hover:bg-[var(--lo1-celestial)]/20
                   flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 rounded-full bg-[var(--lo1-void)] border border-[var(--lo1-celestial)]/30
                   text-[var(--lo1-starlight)] hover:bg-[var(--lo1-celestial)]/20
                   flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}
