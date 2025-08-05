"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Duties from "@/pages/Duties";

export default function DutiesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Duties />
      </Layout>
    </ProtectedRoute>
  );
}
