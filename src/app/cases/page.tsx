"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Dynamically import Cases to prevent SSR issues with context providers
const Cases = dynamicImport(() => import("@/views/Cases"), {
  ssr: false,
  loading: () => <PageLoading text="Loading cases..." />,
});

export default function CasesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Cases />
      </Layout>
    </ProtectedRoute>
  );
}
