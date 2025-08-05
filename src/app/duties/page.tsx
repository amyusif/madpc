"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Duties from "@/pages/Duties";

export default function DutiesPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Duties />
    </Layout>
  );
}
