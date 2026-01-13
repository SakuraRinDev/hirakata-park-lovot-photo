import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOVOT MEMORY STUDIO | HIRAKATA PARK",
  description: "LOVOT MEMORY STUDIO",
  openGraph: {
    title: "LOVOT MEMORY STUDIO | HIRAKATA PARK",
    description: "LOVOT MEMORY STUDIO",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// LOVOTアイコンコンポーネント
function LovotIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="10" r="8" fill="currentColor" opacity="0.9" />
      <circle cx="9" cy="9" r="1.5" fill="white" />
      <circle cx="15" cy="9" r="1.5" fill="white" />
      <ellipse cx="12" cy="2" rx="2" ry="1.5" fill="currentColor" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased sparkle-bg">
        <div className="min-h-dvh flex flex-col">
          {/* ヘッダー */}
          <header className="py-4 px-4">
            <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
              <LovotIcon className="w-6 h-6 text-lovot-text" />
              <h1 className="text-sm font-bold tracking-widest text-lovot-text">
                LOVOT MEMORY STUDIO
              </h1>
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
            <p className="text-[10px] text-lovot-text-light tracking-wider">
              Created by 株式会社SakuraRin
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
