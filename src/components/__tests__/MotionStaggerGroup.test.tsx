import { render, screen } from "@testing-library/react";
import { MotionStaggerGroup, MotionStaggerItem } from "../MotionStaggerGroup";

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

describe("MotionStaggerGroup", () => {
  it("renders children", () => {
    render(
      <MotionStaggerGroup>
        <span>Child 1</span>
        <span>Child 2</span>
      </MotionStaggerGroup>
    );
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });

  it("applies className", () => {
    const { container } = render(
      <MotionStaggerGroup className="grid gap-4">
        <span>Content</span>
      </MotionStaggerGroup>
    );
    expect(container.firstChild).toHaveClass("grid", "gap-4");
  });

  it("uses stagger container variants with default delay", () => {
    const { container } = render(
      <MotionStaggerGroup>
        <span>Content</span>
      </MotionStaggerGroup>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    expect(variants.visible.transition.staggerChildren).toBe(0.1);
  });

  it("uses custom stagger delay", () => {
    const { container } = render(
      <MotionStaggerGroup staggerDelay={0.2}>
        <span>Content</span>
      </MotionStaggerGroup>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    expect(variants.visible.transition.staggerChildren).toBe(0.2);
  });

  it("uses hidden/visible for initial/animate", () => {
    const { container } = render(
      <MotionStaggerGroup>
        <span>Content</span>
      </MotionStaggerGroup>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.dataset.initial).toBe("hidden");
    expect(div.dataset.animate).toBe("visible");
  });
});

describe("MotionStaggerItem", () => {
  it("renders children", () => {
    render(
      <MotionStaggerItem>
        <span>Item content</span>
      </MotionStaggerItem>
    );
    expect(screen.getByText("Item content")).toBeInTheDocument();
  });

  it("applies className", () => {
    const { container } = render(
      <MotionStaggerItem className="item-class">
        <span>Content</span>
      </MotionStaggerItem>
    );
    expect(container.firstChild).toHaveClass("item-class");
  });

  it("uses stagger child variants", () => {
    const { container } = render(
      <MotionStaggerItem>
        <span>Content</span>
      </MotionStaggerItem>
    );
    const div = container.firstChild as HTMLElement;
    const variants = JSON.parse(div.dataset.variants!);
    expect(variants.hidden.opacity).toBe(0);
    expect(variants.visible.opacity).toBe(1);
    expect(variants.visible.transition.duration).toBe(0.3);
  });
});
