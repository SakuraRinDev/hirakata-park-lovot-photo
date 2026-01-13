"use client";

import { downloadImage, copyImageToClipboard } from "@/lib/imageUtils";
import { saveImage } from "@/lib/imageStorage";
import { useState } from "react";

interface ResultDisplayProps {
  imageData: string;
  originalImage?: string;
  onReset: () => void;
  onSaved?: () => void;
}

export default function ResultDisplay({
  imageData,
  originalImage,
  onReset,
  onSaved
}: ResultDisplayProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ダウンロード
  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadImage(imageData, `lovot-hirakata-${timestamp}.png`);
  };

  // Xでシェア
  const handleShareX = () => {
    const text = encodeURIComponent(
      "Lovotと一緒に特別な写真を作ったよ！🤖✨ #ひらかたパーク #Lovot"
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
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

  // ギャラリーに保存
  const handleSaveToGallery = async () => {
    if (isSaving || saveSuccess) return;

    setIsSaving(true);
    try {
      await saveImage({
        imageData,
        model: "gemini-3-pro",
        modelName: "Gemini 3 Pro",
        originalImage,
      });
      setSaveSuccess(true);
      onSaved?.();
    } catch (error) {
      console.error("保存に失敗しました:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 pb-8">
      {/* 完成メッセージ */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-hirakata-dark mb-1">
          完成！
        </h2>
        <p className="text-sm text-gray-600">
          素敵な写真ができました
        </p>
      </div>

      {/* 生成画像 */}
      <div className="w-full max-w-md">
        <img
          src={`data:image/png;base64,${imageData}`}
          alt="合成された写真"
          className="w-full rounded-2xl shadow-xl"
        />
      </div>

      {/* アクションボタン */}
      <div className="w-full max-w-md space-y-3">
        {/* 保存ボタン群 */}
        <div className="flex gap-3">
          {/* ダウンロードボタン */}
          <button
            onClick={handleDownload}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ダウンロード
          </button>

          {/* ギャラリー保存ボタン */}
          <button
            onClick={handleSaveToGallery}
            disabled={isSaving || saveSuccess}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-semibold transition ${
              saveSuccess
                ? "bg-green-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-600"
            } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {saveSuccess ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存済み
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {isSaving ? "保存中..." : "履歴に保存"}
              </>
            )}
          </button>
        </div>

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
            画像をコピーしました！Instagramに貼り付けてください
          </p>
        )}
      </div>

      {/* もう一度ボタン */}
      <button
        onClick={onReset}
        className="btn-secondary mt-4"
      >
        もう一度作る
      </button>
    </div>
  );
}
