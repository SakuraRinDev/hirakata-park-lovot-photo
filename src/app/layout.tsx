import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lovot フォト合成 | ひらかたパーク",
  description: "あなたのLovotを特別な写真に合成しよう！",
  openGraph: {
    title: "Lovot フォト合成 | ひらかたパーク",
    description: "あなたのLovotを特別な写真に合成しよう！",
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
      <body className="antialiased">
        <div className="min-h-dvh flex flex-col">
          {/* ヘッダー */}
          <header className="bg-hirakata-primary text-white py-3 px-4 shadow-lg">
            <div className="max-w-md mx-auto flex items-center justify-center gap-2">
              <h1 className="text-lg font-bold tracking-wide">
                Lovot フォト合成
              </h1>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* フッター */}
          <footer className="bg-hirakata-dark text-white/60 text-xs py-3 text-center">
            <p>&copy; ひらかたパーク</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
