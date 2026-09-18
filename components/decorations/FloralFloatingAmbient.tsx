import React from "react";
import FloralAccent from "./FloralAccent";

interface FloralFloatingAmbientProps {
  preset?: "corners" | "auth" | "subtle" | "rich";
  className?: string;
}

export default function FloralFloatingAmbient({
  preset = "subtle",
  className = "",
}: FloralFloatingAmbientProps) {
  if (preset === "auth") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      >
        {/* Top Right Pink Blossom */}
        <div className="absolute -top-6 -right-6 sm:top-4 sm:right-6 opacity-80 md:opacity-90">
          <FloralAccent
            flower={1}
            size="lg"
            variant="float"
            className="rotate-12 scale-110"
          />
        </div>

        {/* Bottom Left Blue Bouquet */}
        <div className="absolute -bottom-8 -left-6 sm:bottom-6 sm:left-8 opacity-75 md:opacity-85">
          <FloralAccent
            flower={2}
            size="lg"
            variant="float-delayed"
            className="-rotate-6"
          />
        </div>

        {/* Top Left Lotus Stem Accent */}
        <div className="hidden lg:block absolute top-1/4 left-10 opacity-60">
          <FloralAccent
            flower={3}
            size="md"
            variant="sway"
            className="-rotate-12"
          />
        </div>
      </div>
    );
  }

  if (preset === "corners") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      >
        <div className="absolute top-2 right-2 sm:top-6 sm:right-6 opacity-75">
          <FloralAccent flower={1} size="md" variant="float" className="rotate-12" />
        </div>
        <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 opacity-70">
          <FloralAccent flower={2} size="md" variant="float-delayed" className="-rotate-12" />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
    >
      <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-60 sm:opacity-75">
        <FloralAccent flower={1} size="lg" variant="float" />
      </div>
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-60 sm:opacity-70">
        <FloralAccent flower={2} size="lg" variant="float-delayed" />
      </div>
    </div>
  );
}
