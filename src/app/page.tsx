"use client";

import dynamicImport from "next/dynamic";

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";

// Dynamically import Auth with SSR disabled to prevent build errors
const Auth = dynamicImport(() => import("@/views/Auth"), {
  ssr: false,
  loading: () => null, // No loading component to prevent SSR issues
});

export default function Home() {
  // Show auth page directly as the main page
  return <Auth />;
}
