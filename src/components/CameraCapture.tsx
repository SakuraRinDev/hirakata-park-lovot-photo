"use client";

import { useRef, useState, useCallback, useEffect, ChangeEvent } from "react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onBack?: () => void;
}

export default function CameraCapture({ onCapture, onBack }: CameraCaptureProps) {
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* 戻るボタン */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-20 left-4 p-2 text-lovot-text hover:text-lovot-primary transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* メインコンテナ */}
      <div className="main-container w-full max-w-md px-6 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-4">
            <p className="text-sm">{error}</p>
            <button
              onClick={startCamera}
              className="mt-2 text-sm underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* カメラ未起動時 */}
        {!isStreaming && !error && (
          <>

            {/* 円形フレーム（プレースホルダー） */}
            <div className="flex justify-center mb-6">
              <div className="circular-frame flex items-center justify-center">
                <svg className="w-16 h-16 camera-icon" viewBox="0 0 48 48" fill="none">
                  <rect x="12" y="18" width="24" height="18" rx="3" fill="currentColor" opacity="0.5" />
                  <rect x="18" y="14" width="8" height="4" rx="1" fill="currentColor" opacity="0.4" />
                  <circle cx="24" cy="27" r="6" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startCamera}
                className="btn-primary flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                カメラを起動
              </button>
              <button
                onClick={openFileSelector}
                className="btn-secondary flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                画像を選択
              </button>
            </div>
          </>
        )}

        {/* カメラプレビュー */}
        {isStreaming && (
          <>

            {/* 円形フレーム（カメラ映像） */}
            <div className="flex justify-center mb-6 relative">
              <div className="circular-frame">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                />
              </div>

              {/* カメラ切り替えボタン */}
              <button
                onClick={toggleCamera}
                className="absolute top-2 right-2 bg-white/80 text-lovot-text p-2 rounded-full hover:bg-white transition shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* シャッターボタン */}
            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                className="shutter-button"
              >
                <div className="shutter-button-inner" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 非表示のcanvas（撮影用） */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
