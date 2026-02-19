import { renderHook, act } from "@testing-library/react";
import { useSourcePreference } from "../useConfederationPreference";

describe("useSourcePreference", () => {
  const STORAGE_KEY = "lo1-source-filter";
  const LEGACY_STORAGE_KEY = "lo1-include-confederation";

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("default behavior", () => {
    it("should default to 'ra' when no stored value", () => {
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("ra");
    });

    it("should read stored source filter from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "confederation");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("confederation");
    });

    it("should read 'all' from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "all");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("all");
    });

    it("should default to 'ra' for invalid stored values", () => {
      localStorage.setItem(STORAGE_KEY, "invalid");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("ra");
    });
  });

  describe("legacy migration", () => {
    it("should migrate legacy 'true' to 'all'", () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, "true");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("all");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("all");
    });

    it("should keep 'ra' default for legacy 'false'", () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, "false");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("ra");
    });

    it("should prefer new key over legacy key", () => {
      localStorage.setItem(STORAGE_KEY, "confederation");
      localStorage.setItem(LEGACY_STORAGE_KEY, "true");
      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("confederation");
    });
  });

  describe("initialOverride", () => {
    it("should use initialOverride over localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "ra");
      const { result } = renderHook(() => useSourcePreference("all"));
      expect(result.current.sourceFilter).toBe("all");
    });

    it("should fall back to localStorage when initialOverride is undefined", () => {
      localStorage.setItem(STORAGE_KEY, "confederation");
      const { result } = renderHook(() => useSourcePreference(undefined));
      expect(result.current.sourceFilter).toBe("confederation");
    });
  });

  describe("setSourceFilter", () => {
    it("should update state when called", () => {
      const { result } = renderHook(() => useSourcePreference());

      act(() => {
        result.current.setSourceFilter("confederation");
      });

      expect(result.current.sourceFilter).toBe("confederation");
    });

    it("should persist to localStorage when changed", () => {
      const { result } = renderHook(() => useSourcePreference());

      act(() => {
        result.current.setSourceFilter("all");
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe("all");
    });

    it("should persist 'ra' to localStorage", () => {
      const { result } = renderHook(() => useSourcePreference("all"));

      act(() => {
        result.current.setSourceFilter("ra");
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe("ra");
    });
  });

  describe("graceful degradation", () => {
    it("should default to 'ra' when localStorage throws", () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error("Private browsing");
      };

      const { result } = renderHook(() => useSourcePreference());
      expect(result.current.sourceFilter).toBe("ra");

      Storage.prototype.getItem = originalGetItem;
    });

    it("should not throw when localStorage.setItem fails", () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error("Quota exceeded");
      };

      const { result } = renderHook(() => useSourcePreference());

      expect(() => {
        act(() => {
          result.current.setSourceFilter("confederation");
        });
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });
});
