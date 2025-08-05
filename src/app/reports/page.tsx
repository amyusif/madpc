"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Reports from "@/pages/Reports";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Reports />
      </Layout>
    </ProtectedRoute>
  );
}
