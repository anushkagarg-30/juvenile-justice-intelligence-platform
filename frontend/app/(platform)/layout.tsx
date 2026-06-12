import { JusticeScaleBackdrop } from "@/components/JusticeScaleBackdrop";
import { Sidebar } from "@/components/Sidebar";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="relative flex-1 overflow-y-auto">
        <JusticeScaleBackdrop variant="platform" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
