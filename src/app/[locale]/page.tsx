import NavigationWrapper from "@/components/NavigationWrapper";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper>
        <div className="flex-1 overflow-y-auto relative z-10">
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        </div>
      </NavigationWrapper>
    </main>
  );
}
