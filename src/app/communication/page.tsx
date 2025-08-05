"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Communication from "@/pages/Communication";

export default function CommunicationPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Communication />
      </Layout>
    </ProtectedRoute>
  );
}
