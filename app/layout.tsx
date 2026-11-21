import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "SellerApp — Resale research, simplified", description: "AI-assisted resale research workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
