import React from "react";

type LogoMarkProps = {
  className?: string;
};

const LogoMark = ({ className = "" }: LogoMarkProps) => (
  <span
    className={`brand-logo text-3xl lg:text-xl -mt-1 md:mt-0 ${className}`}
    aria-label="GirlyHub"
  >
    <span className="brand-logo-girly text-rose-500">Girly</span>
    <span className="brand-logo-hub">Hub</span>
    <span className="brand-logo-dot text-rose-500">.</span>
  </span>
);

export default LogoMark;
