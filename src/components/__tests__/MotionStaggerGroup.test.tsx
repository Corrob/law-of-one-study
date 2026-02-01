import { render, screen } from "@testing-library/react";
import { MotionStaggerGroup, MotionStaggerItem } from "../MotionStaggerGroup";

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

  it("injects stagger delay on children with default delay", () => {
    const { container } = render(
      <MotionStaggerGroup>
        <MotionStaggerItem>First</MotionStaggerItem>
        <MotionStaggerItem>Second</MotionStaggerItem>
        <MotionStaggerItem>Third</MotionStaggerItem>
      </MotionStaggerGroup>
    );
    const items = container.querySelectorAll(".animate-opacity-fade-in");
    expect((items[0] as HTMLElement).style.animationDelay).toBe("0s");
    expect((items[1] as HTMLElement).style.animationDelay).toBe("0.1s");
    expect((items[2] as HTMLElement).style.animationDelay).toBe("0.2s");
  });

  it("uses custom stagger delay", () => {
    const { container } = render(
      <MotionStaggerGroup staggerDelay={0.2}>
        <MotionStaggerItem>First</MotionStaggerItem>
        <MotionStaggerItem>Second</MotionStaggerItem>
      </MotionStaggerGroup>
    );
    const items = container.querySelectorAll(".animate-opacity-fade-in");
    expect((items[0] as HTMLElement).style.animationDelay).toBe("0s");
    expect((items[1] as HTMLElement).style.animationDelay).toBe("0.2s");
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

  it("has animate-opacity-fade-in class", () => {
    const { container } = render(
      <MotionStaggerItem>
        <span>Content</span>
      </MotionStaggerItem>
    );
    expect(container.firstChild).toHaveClass("animate-opacity-fade-in");
  });
});
