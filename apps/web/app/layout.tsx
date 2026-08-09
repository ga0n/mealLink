import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { Web3Provider } from "@/components/web3-provider";

export const metadata: Metadata = {
  title: "한끼이음 | 한 끼의 여정을 잇다",
  description:
    "후원된 식사권이 지역의 따뜻한 한 끼로 이어지는 과정을 확인하는 서비스",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "한끼이음" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#176b58",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <Web3Provider>
          <DemoProvider>
            <Header />
            <main>{children}</main>
            <BottomNav />
          </DemoProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
