"use client";

import { cn } from "@/lib/utils";
import { FlowingJusticeScaleCanvas } from "@/components/FlowingJusticeScaleCanvas";
import { PlatformScaleBackdrop } from "@/components/PlatformScaleBackdrop";

type JusticeScaleBackdropProps = {
  variant?: "landing" | "platform";
};

export function JusticeScaleBackdrop({ variant = "landing" }: JusticeScaleBackdropProps) {
  const isPlatform = variant === "platform";

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", !isPlatform && "z-0")} aria-hidden>
      {isPlatform ? (
        <PlatformScaleBackdrop />
      ) : (
        <>
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(59,130,246,0.12),transparent)]" />
          <FlowingJusticeScaleCanvas className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background to-transparent md:h-96" />
        </>
      )}
    </div>
  );
}
