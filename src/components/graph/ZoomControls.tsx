/**
 * Zoom control buttons for the concept graph.
 */

import { select } from "d3-selection";
import type { ZoomBehavior } from "d3-zoom";

interface ZoomControlsProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomRef: React.RefObject<ZoomBehavior<SVGSVGElement, unknown> | null>;
}

export function ZoomControls({ svgRef, zoomRef }: ZoomControlsProps) {
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = select(svgRef.current);
      svg.transition().duration(200).call(
        zoomRef.current.scaleBy,
        1.3
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = select(svgRef.current);
      svg.transition().duration(200).call(
        zoomRef.current.scaleBy,
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
