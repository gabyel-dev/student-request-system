import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import { ToasterProvider } from "@/app/components/toaster";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  weight: "400",
  variable: "--font-dm-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ItikQ",
  description: "A Student Request System for students",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  );
}
