"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  timestamp: string;
  type: "log" | "warn" | "error";
  message: string;
}

export default function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" ");
      setLogs((prev) => [...prev.slice(-99), {
        timestamp: new Date().toLocaleTimeString(),
        type: "log",
        message,
      }]);
      originalLog.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" ");
      setLogs((prev) => [...prev.slice(-99), {
        timestamp: new Date().toLocaleTimeString(),
        type: "warn",
        message,
      }]);
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" ");
      setLogs((prev) => [...prev.slice(-99), {
        timestamp: new Date().toLocaleTimeString(),
        type: "error",
        message,
      }]);
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const handleCopy = async () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(logText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-[var(--lo1-indigo)] text-[var(--lo1-gold)] px-3 py-2 rounded-lg shadow-lg border border-[var(--lo1-gold)] hover:bg-[var(--lo1-celestial)] transition-colors text-xs font-mono"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-[var(--lo1-deep-space)] border-2 border-[var(--lo1-gold)] rounded-lg shadow-2xl max-h-96 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--lo1-indigo)] px-3 py-2 flex justify-between items-center border-b border-[var(--lo1-gold)]">
        <span className="text-[var(--lo1-gold)] font-mono text-sm font-bold">Console Logs ({logs.length})</span>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="text-[var(--lo1-celestial)] hover:text-[var(--lo1-gold)] text-xs font-mono"
          >
            Clear
          </button>
          <button
            onClick={handleCopy}
            className="text-[var(--lo1-celestial)] hover:text-[var(--lo1-gold)] text-xs font-mono"
          >
            {copySuccess ? "✓ Copied" : "Copy All"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--lo1-celestial)] hover:text-[var(--lo1-gold)] text-xs font-mono"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-[var(--lo1-stardust)] italic">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                log.type === "error"
                  ? "bg-red-900/20 text-red-300"
                  : log.type === "warn"
                  ? "bg-yellow-900/20 text-yellow-300"
                  : "bg-[var(--lo1-indigo)]/30 text-[var(--lo1-starlight)]"
              }`}
            >
              <div className="flex gap-2 text-[10px] text-[var(--lo1-stardust)] mb-1">
                <span>{log.timestamp}</span>
                <span className="uppercase font-bold">{log.type}</span>
              </div>
              <div className="whitespace-pre-wrap break-all">{log.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
