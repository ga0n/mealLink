import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "한끼이음 | 한 끼의 여정을 잇다",
  description: "후원한 식사권이 지역의 따뜻한 한 끼로 이어지는 과정을 확인하는 데모 서비스"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <DemoProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </DemoProvider>
      </body>
    </html>
  );
}
