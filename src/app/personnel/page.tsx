"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Personnel to prevent SSR issues with context providers
const Personnel = dynamicImport(() => import("@/views/Personnel"), {
  ssr: false,
  loading: () => <PageLoading text="Loading personnel..." />,
});

export default function PersonnelPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Personnel />
      </Layout>
    </ProtectedRoute>
  );
}
