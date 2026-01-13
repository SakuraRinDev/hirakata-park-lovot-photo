import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOVOT × ひらパー",
  description: "LOVOT × ひらパー - Support by 株式会社SakuraRin",
  openGraph: {
    title: "LOVOT × ひらパー",
    description: "LOVOT × ひらパー - Support by 株式会社SakuraRin",
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
      <body className="antialiased sparkle-bg">
        <div className="min-h-dvh flex flex-col">
          {/* ヘッダー */}
          <header className="py-4 px-4 bg-transparent">
            <div className="max-w-lg mx-auto flex flex-col items-center justify-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white [text-shadow:none]">
                LOVOT × ひらパー
              </h1>
              <p className="text-sm text-white/90 tracking-wider mt-1 [text-shadow:none]">
                Support by 株式会社SakuraRin
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
