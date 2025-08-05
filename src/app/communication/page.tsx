"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Communication to prevent SSR issues with context providers
const Communication = dynamicImport(() => import("@/views/Communication"), {
  ssr: false,
  loading: () => <PageLoading text="Loading communication..." />,
});

export default function CommunicationPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Communication />
      </Layout>
    </ProtectedRoute>
  );
}
