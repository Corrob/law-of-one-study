/**
 * Tests for ZoomControls component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ZoomControls } from "../ZoomControls";
import * as d3 from "d3";

// Mock D3
jest.mock("d3", () => ({
  select: jest.fn(() => ({
    transition: jest.fn(() => ({
      duration: jest.fn(() => ({
        call: jest.fn(),
      })),
    })),
  })),
  zoom: jest.fn(() => ({
    scaleBy: jest.fn(),
  })),
}));

describe("ZoomControls", () => {
  const mockSvgRef = { current: document.createElementNS("http://www.w3.org/2000/svg", "svg") };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders zoom in and zoom out buttons", () => {
    render(<ZoomControls svgRef={mockSvgRef} />);

    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
  });

  it("displays + and − symbols", () => {
    render(<ZoomControls svgRef={mockSvgRef} />);

    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("−")).toBeInTheDocument();
  });

  it("calls d3.select when zoom in is clicked", () => {
    render(<ZoomControls svgRef={mockSvgRef} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));

    expect(d3.select).toHaveBeenCalledWith(mockSvgRef.current);
  });

  it("calls d3.select when zoom out is clicked", () => {
    render(<ZoomControls svgRef={mockSvgRef} />);

    fireEvent.click(screen.getByLabelText("Zoom out"));

    expect(d3.select).toHaveBeenCalledWith(mockSvgRef.current);
  });

  it("does not call d3.select when svgRef.current is null", () => {
    const nullRef = { current: null };
    render(<ZoomControls svgRef={nullRef} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));
    fireEvent.click(screen.getByLabelText("Zoom out"));

    expect(d3.select).not.toHaveBeenCalled();
  });

  it("has correct button styling", () => {
    render(<ZoomControls svgRef={mockSvgRef} />);

    const zoomInBtn = screen.getByLabelText("Zoom in");
    const zoomOutBtn = screen.getByLabelText("Zoom out");

    expect(zoomInBtn).toHaveClass("w-10", "h-10", "rounded-full");
    expect(zoomOutBtn).toHaveClass("w-10", "h-10", "rounded-full");
  });
});
