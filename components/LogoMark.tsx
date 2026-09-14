import React from "react";

type LogoMarkProps = {
  className?: string;
  isFooter?: boolean;
};

const LogoMark = ({ className = "", isFooter = false }: LogoMarkProps) => (
  <span className={`brand-logo inline-flex ${className}`}>
    <img
      // src="/original-girly.png"
      src={isFooter ? "/girlyhub_non_transparent.png" : "/new-girlyhub.png"}
      alt="GirlyHub"
      className="h-auto max-h-full w-auto max-w-full object-contain"
    />
  </span>
);

export default LogoMark;
