"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Settings to prevent SSR issues with context providers
const Settings = dynamicImport(() => import("@/views/Settings"), {
  ssr: false,
  loading: () => <PageLoading text="Loading settings..." />,
});

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Settings />
      </Layout>
    </ProtectedRoute>
  );
}
