import type { Metadata } from "next";
import { newsreader, bricolage } from "./fonts";
import "./globals.css";
import "./polish.css";
import { DemoNotice } from "@/components/DemoNotice";
import { WalletPicker } from "@/components/WalletPicker";
import { AppHeader } from "@/components/nav/AppHeader";
import { SiteFooter } from "@/components/nav/SiteFooter";

export const metadata: Metadata = {
  title: "liber:Ghost Protocol",
  description: "Your wallet survives your phone. Prefunded, merchant-bound paper authorizations on BNB Smart Chain testnet. Buyer offline, merchant online.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${newsreader.variable} ${bricolage.variable}`}>
      <body className="font-body antialiased"><AppHeader /><DemoNotice /><WalletPicker />{children}<SiteFooter /></body>
    </html>
  );
}
