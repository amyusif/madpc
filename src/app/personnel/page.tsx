"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Personnel from "@/pages/Personnel";

export default function PersonnelPage() {
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
      <Personnel />
    </Layout>
  );
}
