import { render, screen } from "@testing-library/react";
import MotionFadeIn from "../MotionFadeIn";

// Mock framer-motion to render plain divs (framer-motion doesn't work in jsdom)
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      variants,
      initial,
      animate,
      ...rest
    }: {
      children?: React.ReactNode;
      className?: string;
      variants?: Record<string, unknown>;
      initial?: string;
      animate?: string;
      [key: string]: unknown;
    }) => (
      <div
        className={className}
        data-variants={JSON.stringify(variants)}
        data-initial={initial}
        data-animate={animate}
        {...rest}
      >
        {children}
      </div>
    ),
  },
}));

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

  it("uses hidden/visible for initial/animate", () => {
    const { container } = render(
      <MotionFadeIn>
        <span>Content</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.dataset.initial).toBe("hidden");
    expect(div.dataset.animate).toBe("visible");
  });

  it("uses title variants when variant='title'", () => {
    const { container } = render(
      <MotionFadeIn variant="title">
        <span>Title</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    // Title variant has 0.4s duration
    expect(variants.visible.transition.duration).toBe(0.4);
  });

  it("uses fadeWithDelay(0) for default variant", () => {
    const { container } = render(
      <MotionFadeIn>
        <span>Default</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    expect(variants.visible.transition.delay).toBe(0);
    expect(variants.visible.transition.duration).toBe(0.3);
  });

  it("uses custom delay when provided", () => {
    const { container } = render(
      <MotionFadeIn delay={0.5}>
        <span>Delayed</span>
      </MotionFadeIn>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    expect(variants.visible.transition.delay).toBe(0.5);
  });
});
