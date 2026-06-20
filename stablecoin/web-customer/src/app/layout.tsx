import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tienda - Ecommerce",
  description: "Compra productos con EuroTokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
