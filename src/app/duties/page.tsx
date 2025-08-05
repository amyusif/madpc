"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Duties to prevent SSR issues with context providers
const Duties = dynamicImport(() => import("@/views/Duties"), {
  ssr: false,
  loading: () => <PageLoading text="Loading duties..." />,
});

export default function DutiesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Duties />
      </Layout>
    </ProtectedRoute>
  );
}
