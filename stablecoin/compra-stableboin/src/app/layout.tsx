import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "EuroToken - Compra de Stablecoins",
  description:
    "Compra EuroTokens (EURT) usando tarjeta de credito. Stablecoin respaldada por euros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-canvas text-body font-sans">
        {children}
      </body>
    </html>
  );
}
