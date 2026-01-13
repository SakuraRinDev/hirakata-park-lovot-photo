"use client";

import { downloadImage, copyImageToClipboard } from "@/lib/imageUtils";
import { useState } from "react";

interface ResultDisplayProps {
  imageData: string;
  onReset: () => void;
}

export default function ResultDisplay({
  imageData,
  onReset,
}: ResultDisplayProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // ダウンロード
  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadImage(imageData, `lovot-memory-${timestamp}.png`);
  };

  // Xでシェア（Web Share APIを使用）
  const handleShareX = async () => {
    const shareText = "#LOVOTMEMORYSTUDIO #ひらかたパーク #LOVOT";

    // Web Share APIが使える場合は画像付きでシェア
    if (navigator.share && navigator.canShare) {
      try {
        // Base64を Blob に変換
        const byteCharacters = atob(imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const file = new File([blob], "lovot-memory.png", { type: "image/png" });

        const shareData = {
          text: shareText,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (error) {
        console.log("Web Share API failed:", error);
      }
    }

    // フォールバック：画像をクリップボードにコピーしてからTwitterを開く
    const success = await copyImageToClipboard(imageData);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
    // Twitterを開く（テキストのみ）
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank");
  };

  // Instagramでシェア（クリップボードにコピー）
  const handleShareInstagram = async () => {
    const success = await copyImageToClipboard(imageData);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } else {
      // フォールバック：ダウンロード
      handleDownload();
      alert("画像をダウンロードしました。Instagramで投稿してください！");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="main-container w-full max-w-md px-6 py-8">
        {/* 完成メッセージ */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-lovot-text">
            完成！
          </h2>
        </div>

        {/* 生成画像 */}
        <div className="mb-6">
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="合成された写真"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          {/* ダウンロードボタン */}
          <button
            onClick={handleDownload}
            className="w-full btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ダウンロード
          </button>

          {/* シェアボタン */}
          <div className="flex gap-3">
            {/* X */}
            <button
              onClick={handleShareX}
              className="flex-1 bg-black text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>

            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </button>
          </div>

          {/* コピー成功メッセージ */}
          {copySuccess && (
            <p className="text-center text-green-600 text-sm font-medium">
              画像をコピーしました！貼り付けてシェアしてください
            </p>
          )}
        </div>

        {/* もう一度ボタン */}
        <div className="mt-6 text-center">
          <button
            onClick={onReset}
            className="btn-secondary"
          >
            もう一度作る
          </button>
        </div>
      </div>
    </div>
  );
}
