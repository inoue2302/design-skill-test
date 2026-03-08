import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "設計力テスト — エンジニアの設計判断力を診断",
  description:
    "ランダムなお題・現場条件・納期に対して設計判断を回答。AIが5問の対話で深掘りし、設計力スコアを算出します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
