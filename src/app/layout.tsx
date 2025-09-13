import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VeMorable - Voice-First AI Note Taking",
  description: "Transform your thoughts into structured knowledge with voice-powered AI note-taking",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#212121" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInForceRedirectUrl={undefined}
      signUpForceRedirectUrl={undefined}
    >
      <html 
        lang="en" 
        data-theme="dark"
        className="theme-transition"
        suppressHydrationWarning
      >
        <head>
          {/* Prevent flash of unstyled content */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Check for saved theme preference or default to 'dark'
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                  
                  // Apply theme class for smooth transitions
                  document.documentElement.classList.add('theme-transition');
                  
                  // Set CSS custom property for theme
                  document.documentElement.style.setProperty('--current-theme', savedTheme);
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${inter.variable} antialiased font-primary`}
          suppressHydrationWarning
        >
          <div id="theme-provider" data-theme="dark">
            {children}
          </div>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
