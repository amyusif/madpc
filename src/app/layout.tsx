import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./providers";
import { NavigationProgress } from "@/components/NavigationProgress";

export const metadata: Metadata = {
  title: "MADPC - Police Command System",
  description: "Modern Police Command and Control System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <NavigationProgress />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
