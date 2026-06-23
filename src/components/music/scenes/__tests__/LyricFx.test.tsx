import { render } from "@testing-library/react";
import LyricFx from "../LyricFx";

describe("LyricFx", () => {
  it("renders an overlay for a known effect", () => {
    const { container } = render(
      <LyricFx effect="bloom" trigger={1} color="#38bdf8" reducedMotion={false} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders nothing under reduced motion", () => {
    const { container } = render(
      <LyricFx effect="bloom" trigger={1} color="#38bdf8" reducedMotion />
    );
    expect(container.firstChild).toBeNull();
  });

  it("ignores unknown or scene-specific hints and absent effects", () => {
    const { container: unknown } = render(
      <LyricFx effect="nonsense" trigger={1} color="#38bdf8" reducedMotion={false} />
    );
    expect(unknown.firstChild).toBeNull();

    // Scene-specific hints are handled by the scene, not LyricFx.
    const { container: sceneHint } = render(
      <LyricFx
        effect="higher-self-reveal"
        trigger={1}
        color="#818cf8"
        reducedMotion={false}
      />
    );
    expect(sceneHint.firstChild).toBeNull();

    const { container: none } = render(
      <LyricFx trigger={1} color="#38bdf8" reducedMotion={false} />
    );
    expect(none.firstChild).toBeNull();
  });
});
