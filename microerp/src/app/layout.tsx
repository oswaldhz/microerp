import type { Metadata } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MicroERP | Gestión para pequeñas empresas",
  description: "Sistema ERP para pequeñas empresas: ventas, inventario, facturación y reportes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}