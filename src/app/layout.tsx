import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./providers";
import { NavigationProgress } from "@/components/NavigationProgress";
import { SessionManager } from "@/components/SessionManager";

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
    <html lang="en" className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className="h-full bg-background text-foreground overflow-x-hidden">
        <NavigationProgress />
        <ClientProviders>
          <SessionManager />
          <div className="h-full w-full">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
