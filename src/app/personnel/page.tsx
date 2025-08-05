"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Personnel from "@/pages/Personnel";

export default function PersonnelPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Personnel />
      </Layout>
    </ProtectedRoute>
  );
}
