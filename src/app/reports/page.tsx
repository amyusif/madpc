"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Reports to prevent SSR issues with context providers
const Reports = dynamicImport(() => import("@/views/Reports"), {
  ssr: false,
  loading: () => <PageLoading text="Loading reports..." />,
});

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Reports />
      </Layout>
    </ProtectedRoute>
  );
}
