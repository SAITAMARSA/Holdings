import "@fontsource-variable/nunito";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Infit", template: "%s · Infit" },
  description: "Your fitness routine adapts with your life. A personal coach and an AI Fitness Twin.",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-[100] rounded-xl bg-brand-700 px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
