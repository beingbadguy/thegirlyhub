import React from "react";
import FloralAccent, { FlowerType, FloralSize } from "./FloralAccent";

interface FloralHeadingProps {
  title: string;
  subtitle?: string;
  badge?: string;
  flower?: FlowerType;
  secondaryFlower?: FlowerType;
  flowerSize?: FloralSize;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export default function FloralHeading({
  title,
  subtitle,
  badge,
  flower = 1,
  secondaryFlower,
  flowerSize = "sm",
  align = "center",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
}: FloralHeadingProps) {
  const alignClass =
    align === "center"
      ? "text-center items-center justify-center"
      : align === "right"
      ? "text-right items-end justify-end"
      : "text-left items-start justify-start";

  return (
    <div className={`relative mb-6 sm:mb-8 flex flex-col ${alignClass} ${className}`}>
      {badge && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-rose-600 border border-rose-100/80 shadow-xs">
          <FloralAccent flower={flower} size="xs" variant="pulse" className="-ml-1 inline-block" />
          <span>{badge}</span>
        </div>
      )}

      <div className="relative inline-flex items-center gap-2 sm:gap-3">
        {secondaryFlower && (
          <FloralAccent
            flower={secondaryFlower}
            size={flowerSize}
            variant="sway"
            className="hidden sm:inline-block -scale-x-100 opacity-90"
          />
        )}

        <h2
          className={`font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 ${titleClassName}`}
        >
          {title}
        </h2>

        {flower && (
          <FloralAccent
            flower={flower}
            size={flowerSize}
            variant="float"
            className="inline-block opacity-90"
          />
        )}
      </div>

      {subtitle && (
        <p
          className={`mt-2 max-w-2xl text-xs sm:text-sm md:text-base text-neutral-600 font-light ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
