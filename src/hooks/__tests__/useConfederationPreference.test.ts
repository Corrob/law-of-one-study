import { renderHook, act } from "@testing-library/react";
import { useConfederationPreference } from "../useConfederationPreference";

describe("useConfederationPreference", () => {
  const STORAGE_KEY = "lo1-include-confederation";

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("default behavior", () => {
    it("should default to false when no stored value", () => {
      const { result } = renderHook(() => useConfederationPreference());
      expect(result.current.includeConfederation).toBe(false);
    });

    it("should read true from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "true");
      const { result } = renderHook(() => useConfederationPreference());
      expect(result.current.includeConfederation).toBe(true);
    });

    it("should read false from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "false");
      const { result } = renderHook(() => useConfederationPreference());
      expect(result.current.includeConfederation).toBe(false);
    });
  });

  describe("initialOverride", () => {
    it("should use initialOverride=true over localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "false");
      const { result } = renderHook(() => useConfederationPreference(true));
      expect(result.current.includeConfederation).toBe(true);
    });

    it("should use initialOverride=false over localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "true");
      const { result } = renderHook(() => useConfederationPreference(false));
      expect(result.current.includeConfederation).toBe(false);
    });

    it("should fall back to localStorage when initialOverride is undefined", () => {
      localStorage.setItem(STORAGE_KEY, "true");
      const { result } = renderHook(() => useConfederationPreference(undefined));
      expect(result.current.includeConfederation).toBe(true);
    });
  });

  describe("setIncludeConfederation", () => {
    it("should update state when called", () => {
      const { result } = renderHook(() => useConfederationPreference());

      act(() => {
        result.current.setIncludeConfederation(true);
      });

      expect(result.current.includeConfederation).toBe(true);
    });

    it("should persist to localStorage when toggled on", () => {
      const { result } = renderHook(() => useConfederationPreference());

      act(() => {
        result.current.setIncludeConfederation(true);
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("should persist to localStorage when toggled off", () => {
      const { result } = renderHook(() => useConfederationPreference(true));

      act(() => {
        result.current.setIncludeConfederation(false);
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
    });
  });

  describe("graceful degradation", () => {
    it("should default to false when localStorage throws", () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error("Private browsing");
      };

      const { result } = renderHook(() => useConfederationPreference());
      expect(result.current.includeConfederation).toBe(false);

      Storage.prototype.getItem = originalGetItem;
    });

    it("should not throw when localStorage.setItem fails", () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error("Quota exceeded");
      };

      const { result } = renderHook(() => useConfederationPreference());

      expect(() => {
        act(() => {
          result.current.setIncludeConfederation(true);
        });
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });
});
