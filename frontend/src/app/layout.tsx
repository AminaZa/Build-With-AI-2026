import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LinkMind",
  description: "AI-Powered Ecosystem Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-[#0F1117] font-sans text-[#E8E9ED]">
        <Sidebar />
        <div className="pl-[240px] flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 py-8 px-8 lg:px-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
