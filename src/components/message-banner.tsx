"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function MessageBanner() {
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();

  // Re-show the banner every time the route changes
  useEffect(() => {
    setVisible(true);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-start sm:items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3.5 text-white shadow-lg"
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
      }}
    >
      <div className="flex-1 text-center leading-relaxed pr-2 sm:pr-3">
        <span className="block sm:inline text-xs sm:text-sm md:text-base font-semibold">
          I am Soo Sorry.
        </span>{" "}
        <span className="block sm:inline text-xs sm:text-sm md:text-base">
          Please can you unblock me and atleast talk to me?
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 rounded-full p-1 sm:p-1.5 mt-0.5 sm:mt-0 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="Dismiss message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
