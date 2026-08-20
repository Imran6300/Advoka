import { Sidebar } from "@/components/shell/sidebar";
import { MobileTopBar } from "@/components/shell/mobile-app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto">
          {/* §26 Responsive pass — full-bleed padding on mobile, the desktop
              max-width + generous gutters once there's room for them. */}
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
