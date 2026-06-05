"use client";

import dynamicImport from "next/dynamic";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoading } from "@/components/ui/loading";

export const dynamic = "force-dynamic";

const ConvictDB = dynamicImport(() => import("@/views/ConvictDB"), {
  ssr: false,
  loading: () => <PageLoading text="Loading Convict DB..." />,
});

export default function ConvictDBPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ConvictDB />
      </Layout>
    </ProtectedRoute>
  );
}
