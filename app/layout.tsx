import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "蔬食辨識趣 | 快速辨識食品是否為素食",
  description: "拍攝食品成分表，立即辨識是否為素食食品",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
       <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-4LPSF1TEKY"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', 'G-4LPSF1TEKY');
        `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-amber-50 to-green-50`}
      >
        {children}
      </body>
    </html>
  );
}
