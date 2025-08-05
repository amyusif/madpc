"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Dashboard to prevent SSR issues with context providers
const Dashboard = dynamicImport(() => import("@/views/Dashboard"), {
  ssr: false,
  loading: () => <PageLoading text="Loading dashboard..." />,
});

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}
