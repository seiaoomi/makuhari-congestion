import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "幕張エリア混雑予報",
  description: "幕張メッセ・イオンモール幕張新都心・コストコ幕張周辺の道路混雑予測アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
