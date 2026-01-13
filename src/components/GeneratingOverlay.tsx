"use client";

export default function GeneratingOverlay() {
  return (
    <div className="fixed inset-0 bg-lovot-text/90 flex flex-col items-center justify-center z-50">
      {/* アニメーションロゴ */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-lovot-primary/20 animate-pulse-glow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-lovot-gold border-t-transparent animate-spin" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-lovot-cream" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="10" r="8" fill="currentColor" opacity="0.9" />
            <circle cx="9" cy="9" r="1.5" fill="#5C4A3D" />
            <circle cx="15" cy="9" r="1.5" fill="#5C4A3D" />
            <ellipse cx="12" cy="2" rx="2" ry="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* テキスト */}
      <div className="text-center text-white">
        <h2 className="text-xl font-bold">生成中...</h2>
      </div>

      {/* プログレスドット */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-lovot-gold"
            style={{
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
