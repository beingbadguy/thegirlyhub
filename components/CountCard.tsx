import React from "react";

interface CountCardProps {
  icon: React.ReactNode;
  label: string;
  count: number | string;
  color?: string; // Accept Tailwind class e.g., "bg-pink-100" or "text-pink-500"
}

export default function CountCard({
  icon,
  label,
  count,
  color = "bg-pink-100", // default if not passed
}: CountCardProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`text-3xl p-3 rounded-full ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <h3 className="lg:text-xl font-semibold text-gray-800">{count}</h3>
        </div>
      </div>
    </div>
  );
}
