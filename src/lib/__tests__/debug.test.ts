describe("debug", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    jest.resetModules();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
    });

    it("should log messages with debug.log", () => {
      const { debug } = require("../debug");
      debug.log("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("test message");
    });

    it("should log multiple arguments with debug.log", () => {
      const { debug } = require("../debug");
      debug.log("message", { data: 1 }, [1, 2, 3]);
      expect(consoleLogSpy).toHaveBeenCalledWith("message", { data: 1 }, [1, 2, 3]);
    });

    it("should log errors with debug.error", () => {
      const { debug } = require("../debug");
      debug.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
    });

    it("should log warnings with debug.warn", () => {
      const { debug } = require("../debug");
      debug.warn("warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("warning message");
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
    });

    it("should NOT log messages with debug.log", () => {
      const { debug } = require("../debug");
      debug.log("test message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should still log errors with debug.error (always logged)", () => {
      const { debug } = require("../debug");
      debug.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
    });

    it("should NOT log warnings with debug.warn", () => {
      const { debug } = require("../debug");
      debug.warn("warning message");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("in test mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
    });

    it("should log messages with debug.log (test is not production)", () => {
      // Note: debug.log checks NODE_ENV !== "production"
      // So "test" mode allows logging (same as development)
      const { debug } = require("../debug");
      debug.log("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("test message");
    });

    it("should still log errors with debug.error", () => {
      const { debug } = require("../debug");
      debug.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
    });

    it("should handle undefined arguments", () => {
      const { debug } = require("../debug");
      debug.log(undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith(undefined);
    });

    it("should handle null arguments", () => {
      const { debug } = require("../debug");
      debug.log(null);
      expect(consoleLogSpy).toHaveBeenCalledWith(null);
    });

    it("should handle no arguments", () => {
      const { debug } = require("../debug");
      debug.log();
      expect(consoleLogSpy).toHaveBeenCalledWith();
    });

    it("should handle Error objects", () => {
      const { debug } = require("../debug");
      const error = new Error("test error");
      debug.error(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
