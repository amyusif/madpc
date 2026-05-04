"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

export const dynamic = "force-dynamic";

const Leave = dynamicImport(() => import("@/views/Leave"), {
  ssr: false,
  loading: () => <PageLoading text="Loading leave management..." />,
});

export default function LeavePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Leave />
      </Layout>
    </ProtectedRoute>
  );
}
