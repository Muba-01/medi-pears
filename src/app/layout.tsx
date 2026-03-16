import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
<<<<<<< HEAD
import { AuthProvider } from "@/contexts/AuthContext";
import SessionProviderWrapper from "@/components/layout/SessionProviderWrapper";
=======
import AccountLinkPrompt from "@/components/layout/AccountLinkPrompt";
import OnboardingGate from "@/components/layout/OnboardingGate";
import { AuthProvider } from "@/contexts/AuthContext";
import SessionProviderWrapper from "@/components/layout/SessionProviderWrapper";
import { ThemeProvider } from "@/contexts/ThemeContext";
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

export const metadata: Metadata = {
  title: "Medipear — Web3 Community",
  description:
    "The decentralized community platform for Web3 builders, researchers, and explorers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <html lang="en">
      <body className="antialiased">
        <SessionProviderWrapper>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-14">{children}</main>
          </AuthProvider>
        </SessionProviderWrapper>
=======
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const key = "medipear-theme";
  const stored = localStorage.getItem(key);
  const theme = stored === "light" || stored === "dark" ? stored : "dark";
  document.documentElement.setAttribute("data-theme", theme);
})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SessionProviderWrapper>
            <AuthProvider>
              <OnboardingGate />
              <Navbar />
              <AccountLinkPrompt />
              <main className="min-h-screen pt-14">{children}</main>
            </AuthProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a
      </body>
    </html>
  );
}
