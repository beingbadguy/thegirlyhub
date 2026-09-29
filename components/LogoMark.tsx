import React from "react";
import Image from "next/image";

type LogoMarkProps = {
  className?: string;
  isFooter?: boolean;
};

const LogoMark = ({ className = "", isFooter = false }: LogoMarkProps) => (
  <span className={`brand-logo inline-flex ${className}`}>
    <Image
      // src="/original-girly.png"
      src={isFooter ? "/girlyhub_logo_flower_non_transparent_cut.png" : "/girlyhub_logo_flower_transparent.png"}
      alt="GirlyHub"
      width={160}
      height={60}
      priority={!isFooter}
      className="h-auto max-h-full w-auto max-w-full object-contain"
    />
  </span>
);

export default LogoMark;
