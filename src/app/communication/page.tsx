"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Communication from "@/pages/Communication";

export default function CommunicationPage() {
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
      <Communication />
    </Layout>
  );
}
