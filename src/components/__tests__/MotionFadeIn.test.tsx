import { render, screen } from "@testing-library/react";
import MotionFadeIn from "../MotionFadeIn";

describe("MotionFadeIn", () => {
  it("renders children", () => {
    render(
      <MotionFadeIn>
        <span>Hello</span>
      </MotionFadeIn>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies className", () => {
    const { container } = render(
      <MotionFadeIn className="my-class">
        <span>Content</span>
      </MotionFadeIn>
    );
    expect(container.firstChild).toHaveClass("my-class");
  });

  it("uses 0.3s duration for default variant", () => {
    const { container } = render(
      <MotionFadeIn>
        <span>Default</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.animation).toContain("0.3s");
  });

  it("uses 0.4s duration for title variant", () => {
    const { container } = render(
      <MotionFadeIn variant="title">
        <span>Title</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.animation).toContain("0.4s");
  });

  it("applies custom delay", () => {
    const { container } = render(
      <MotionFadeIn delay={0.5}>
        <span>Delayed</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.animation).toContain("0.5s");
  });

  it("defaults to 0s delay when none provided", () => {
    const { container } = render(
      <MotionFadeIn>
        <span>No delay</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.animation).toBe("opacity-fade-in 0.3s ease-out 0s both");
  });
});
