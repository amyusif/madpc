"use client";

import dynamicImport from "next/dynamic";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Auth to prevent SSR issues with context providers
const Auth = dynamicImport(() => import("@/views/Auth"), {
  ssr: false,
  loading: () => <PageLoading text="Loading authentication..." />,
});

export default function Home() {
  // Show auth page directly as the main page
  return <Auth />;
}
