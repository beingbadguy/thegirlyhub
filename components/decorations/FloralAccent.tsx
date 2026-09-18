import React from "react";
import Image from "next/image";

export type FlowerType = 1 | 2 | 3 | "1" | "2" | "3" | "flower" | "flwer" | "flowe2" | "flower3" | "blossom" | "bouquet" | "lotus";
export type FloralVariant = "float" | "float-delayed" | "sway" | "pulse" | "none" | "static";
export type FloralSize = "xs" | "sm" | "md" | "lg" | "xl" | "custom";

interface FloralAccentProps {
  flower?: FlowerType;
  variant?: FloralVariant;
  animation?: FloralVariant;
  size?: FloralSize;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  decorative?: boolean;
  alt?: string;
}

const flowerSrcMap: Record<string, string> = {
  "1": "/flwer.png",
  "flower": "/flwer.png",
  "flwer": "/flwer.png",
  "blossom": "/flwer.png",
  "2": "/flowe2.png",
  "flowe2": "/flowe2.png",
  "flower2": "/flowe2.png",
  "bouquet": "/flowe2.png",
  "3": "/flower3.png",
  "flower3": "/flower3.png",
  "lotus": "/flower3.png",
};

const sizeClasses: Record<FloralSize, string> = {
  xs: "w-6 h-6 sm:w-8 sm:h-8",
  sm: "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
  md: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
  lg: "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36",
  xl: "w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56",
  custom: "",
};

const variantClasses: Record<FloralVariant, string> = {
  float: "floral-float",
  "float-delayed": "floral-float-delayed",
  sway: "floral-sway",
  pulse: "floral-pulse",
  none: "",
  static: "",
};

export default function FloralAccent({
  flower = 1,
  variant,
  animation,
  size = "md",
  className = "",
  style,
  priority = false,
  decorative = true,
  alt = "GirlyHub Floral Ornament",
}: FloralAccentProps) {
  const activeVariant = animation || variant || "float";
  const src = flowerSrcMap[String(flower)] || "/flwer.png";
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const animationClass = variantClasses[activeVariant] || "";

  return (
    <div
      aria-hidden={decorative ? "true" : undefined}
      className={`relative inline-block select-none ${decorative ? "pointer-events-none" : ""} ${sizeClass} ${animationClass} ${className}`.trim()}
      style={style}
    >
      <Image
        src={src}
        alt={decorative ? "" : alt}
        fill
        sizes="(max-width: 640px) 100px, (max-width: 1024px) 150px, 250px"
        priority={priority}
        className="object-contain drop-shadow-sm filter"
      />
    </div>
  );
}
