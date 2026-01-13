"use client";

export default function GeneratingOverlay() {
  return (
    <div className="fixed inset-0 bg-hirakata-dark/90 flex flex-col items-center justify-center z-50">
      {/* アニメーションロゴ */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-hirakata-primary/20 animate-pulse-glow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-hirakata-primary border-t-transparent animate-spin" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🤖</span>
        </div>
      </div>

      {/* テキスト */}
      <div className="text-center text-white">
        <h2 className="text-xl font-bold mb-2">合成中...</h2>
        <p className="text-white/70 text-sm">
          AIがあなたのLovotを<br />
          特別な写真に合成しています
        </p>
      </div>

      {/* プログレスドット */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-hirakata-secondary"
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
