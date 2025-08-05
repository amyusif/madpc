"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Cases from "@/pages/Cases";

export default function CasesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Cases />
      </Layout>
    </ProtectedRoute>
  );
}
