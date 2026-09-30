// Upscale v2 layout — clean, no 3lmni deps
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const kufi = Noto_Kufi_Arabic({ variable: "--font-kufi", subsets: ["arabic"], display: "swap", weight: ["400","500","600","700"] });

export const metadata: Metadata = {
  title: "Upscale v2.1 — Video & Image Enhancer",
  description: "حسّن دقة الصور والفيديو محلياً بـ WebGL2 — بدون رفع، بدون حسابات",
  manifest: "/manifest.json",
  applicationName: "Upscale",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = { themeColor: "#10b981" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${kufi.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
