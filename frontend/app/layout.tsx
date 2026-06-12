import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "Juvenile Justice Intelligence Platform",
  description:
    "AI-powered juvenile case similarity search and legal research for attorneys and policy analysts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
