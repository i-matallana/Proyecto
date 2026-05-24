import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Incapacidades | Gestion Documental",
  description: "Sistema de gestion y analisis de incapacidades medicas con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full bg-background`}>
      <body className="min-h-full flex">
        <TooltipProvider>
          <Sidebar />
          <main className="flex-1 ml-64">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
