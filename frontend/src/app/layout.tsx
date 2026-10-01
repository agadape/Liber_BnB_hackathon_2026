import type { Metadata } from "next";
import { newsreader, bricolage } from "./fonts";
import "./globals.css";
import { DemoNotice } from "@/components/DemoNotice";
import { WalletPicker } from "@/components/WalletPicker";

export const metadata: Metadata = {
  title: "Liber",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${bricolage.variable}`}>
      <body className="font-body antialiased"><DemoNotice /><WalletPicker />{children}</body>
    </html>
  );
}
