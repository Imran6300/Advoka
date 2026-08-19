import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { manrope } from "@/lib/fonts";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advoka — AI Case Intelligence",
  description: "Upload the case. Understand it faster. Work smarter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#5B5BD6",
          colorBackground: "#0B0D12",
          colorInputBackground: "#171B24",
          colorInputText: "#F5F7FA",
          colorText: "#F5F7FA",
          colorTextSecondary: "#A7ADBB",
          colorNeutral: "#F5F7FA",
          colorDanger: "#FB7185",
          colorSuccess: "#34D399",
          borderRadius: "8px",
          fontFamily: "var(--font-manrope), sans-serif",
        },
        elements: {
          card: "bg-surface border border-border shadow-xl",
          headerTitle: "text-text-primary",
          headerSubtitle: "text-text-secondary",
          socialButtonsBlockButton: "border border-border bg-surface-elevated hover:bg-surface-elevated/70",
          formButtonPrimary: "bg-primary hover:bg-primary-hover text-sm normal-case",
          footerActionLink: "text-primary hover:text-primary-hover",
          formFieldInput: "bg-surface-elevated border-border text-text-primary",
          formFieldLabel: "text-text-secondary",
          identityPreviewEditButton: "text-primary",
          dividerLine: "bg-border",
          dividerText: "text-text-muted",
        },
      }}
    >
      <html lang="en" className={manrope.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <QueryProvider>
            <TooltipProvider delayDuration={150}>
              {children}
              <Toaster />
            </TooltipProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
