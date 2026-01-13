import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "LOVOT × ひらパー",
  description: "LOVOT × ひらパー - Support by SakuraRin Creative",
  openGraph: {
    title: "LOVOT × ひらパー",
    description: "LOVOT × ひらパー - Support by SakuraRin Creative",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preload" href="/background.png" as="image" />
      </head>
      <body className={`${zenMaruGothic.className} antialiased sparkle-bg`}>
        {/* 背景画像（中央から円形に広がるアニメーション） */}
        <div className="background-reveal" aria-hidden="true" />
        <div className="min-h-dvh flex flex-col relative z-10">
          {/* ヘッダー */}
          <header className="py-4 px-4 bg-transparent">
            <div className="max-w-lg mx-auto flex flex-col items-center justify-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white [-webkit-text-stroke:1px_black] [paint-order:stroke_fill]">
                LOVOT × ひらパー
              </h1>
              <p className="text-sm text-white tracking-wider mt-1 [-webkit-text-stroke:0.5px_black] [paint-order:stroke_fill]">
                Support by SakuraRin Creative
              </p>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* フッター */}
          <footer className="py-4 px-4 text-center">
            <p className="text-xs text-lovot-text-light tracking-wider mb-1">
              &copy; HIRAKATA PARK × LOVOT
            </p>
            <p className="text-[10px] text-lovot-text tracking-wider">
              Support by トキワバレー
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
