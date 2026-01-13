"use client";

import { useRef, useState, useCallback, useEffect, ChangeEvent } from "react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // カメラ起動
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // 既存のストリームを停止
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("カメラにアクセスできません。カメラの許可を確認してください。");
    }
  }, [facingMode]);

  // カメラ切り替え
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // カメラモード変更時に再起動
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  // 撮影
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 動画のサイズに合わせてcanvasを設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;

    // フロントカメラの場合は左右反転
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    // Base64で出力（プレフィックスなし）
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];

    onCapture(base64);
  }, [facingMode, onCapture]);

  // ファイル選択
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルかチェック
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      onCapture(base64);
    };
    reader.onerror = () => {
      setError("ファイルの読み込みに失敗しました");
    };
    reader.readAsDataURL(file);

    // 入力をリセット（同じファイルを再選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onCapture]);

  // ファイル選択ダイアログを開く
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center w-full max-w-md">
          <p>{error}</p>
          <button
            onClick={startCamera}
            className="mt-2 text-sm underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* カメラ未起動時 */}
      {!isStreaming && !error && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-center">
            <p className="text-lg font-medium text-hirakata-dark mb-2">
              あなたのLovotを撮影しよう！
            </p>
            <p className="text-sm text-gray-600">
              カメラで撮影するか、画像を選択してください
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startCamera}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              カメラを起動
            </button>
            <button
              onClick={openFileSelector}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              画像を選択
            </button>
          </div>
        </div>
      )}

      {/* カメラプレビュー */}
      <div className={`relative w-full max-w-md ${!isStreaming ? "hidden" : ""}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full rounded-2xl shadow-lg ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          style={{ aspectRatio: "4/3", objectFit: "cover" }}
        />

        {/* ガイドオーバーレイ */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/50 rounded-xl" />
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">
              Lovotを枠内に入れてね
            </p>
          </div>
        </div>

        {/* カメラ切り替えボタン */}
        <button
          onClick={toggleCamera}
          className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 撮影ボタン */}
      {isStreaming && (
        <button
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-hirakata-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition"
        >
          <div className="w-14 h-14 rounded-full bg-hirakata-primary" />
        </button>
      )}

      {/* 非表示のcanvas（撮影用） */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
