"use client";

import { useState, useCallback, useRef, useEffect, ChangeEvent } from "react";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import ResultDisplay from "@/components/ResultDisplay";
import DebugPanel from "@/components/DebugPanel";
import { resizeImage } from "@/lib/imageUtils";
import { debug } from "@/lib/debug";

type AppState = "home" | "preview" | "generating" | "result";

// カメラアイコン
function CameraIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M10 8L11 12L10 16L9 12L10 8Z" fill="#D4A574" opacity="0.6" />
      <path d="M38 12L39 16L38 20L37 16L38 12Z" fill="#D4A574" opacity="0.6" />
      <path d="M8 28L9 30L8 32L7 30L8 28Z" fill="#D4A574" opacity="0.4" />
      <rect x="12" y="18" width="24" height="18" rx="3" fill="#D4A574" opacity="0.8" />
      <rect x="18" y="14" width="8" height="4" rx="1" fill="#D4A574" opacity="0.6" />
      <circle cx="24" cy="27" r="6" fill="#E8C9A8" />
      <circle cx="24" cy="27" r="4" fill="#D4A574" opacity="0.5" />
      <circle cx="24" cy="27" r="2" fill="#C49A6C" />
    </svg>
  );
}

// 画像アイコン
function ImageIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>("home");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // デバッグ情報
  const [debugImageInfo, setDebugImageInfo] = useState<any>({});
  const [debugApiInfo, setDebugApiInfo] = useState<any>({});

  // カメラ起動
  const startCamera = useCallback(async () => {
    try {
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
      alert("カメラにアクセスできません");
    }
  }, [facingMode]);

  // カメラ停止
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

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

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 撮影
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];

    stopCamera();
    handleCapture(base64);
  }, [facingMode, stopCamera]);

  // ファイル選択
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      handleCapture(base64);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ファイル選択ダイアログを開く
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 撮影完了
  const handleCapture = useCallback(async (imageData: string) => {
    debug.info("写真を撮影しました");

    const imgInfo = await debug.getImageInfo(imageData);
    debug.info("撮影画像の情報", imgInfo);

    setDebugImageInfo((prev: any) => ({
      ...prev,
      captured: {
        size: imgInfo.size,
        width: imgInfo.dimensions.width,
        height: imgInfo.dimensions.height,
      },
    }));

    setCapturedImage(imageData);
    setState("preview");
  }, []);

  // 再撮影
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setState("home");
    setError(null);
  }, []);

  // 合成開始
  const generateImage = useCallback(async (apiEndpoint: string, logMessage: string) => {
    if (!capturedImage) return;

    setState("generating");
    setError(null);

    const startTime = Date.now();
    debug.info(logMessage);

    try {
      debug.info("画像をリサイズ中...");
      const resizedImage = await resizeImage(capturedImage, 1024);

      const resizedInfo = await debug.getImageInfo(resizedImage);
      debug.success("リサイズ完了", resizedInfo);

      setDebugImageInfo((prev: any) => ({
        ...prev,
        resized: {
          size: resizedInfo.size,
          width: resizedInfo.dimensions.width,
          height: resizedInfo.dimensions.height,
        },
      }));

      const requestTime = Date.now();
      debug.info("APIリクエストを送信中...");

      setDebugApiInfo({
        requestTime,
        responseTime: null,
        totalTime: null,
        status: null,
      });

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lovotImageBase64: resizedImage,
        }),
      });

      const responseTime = Date.now();
      const totalTime = responseTime - startTime;

      setDebugApiInfo({
        requestTime,
        responseTime,
        totalTime,
        status: response.status,
      });

      const data = await response.json();

      if (!response.ok) {
        debug.error("API エラー", { status: response.status, error: data.error });
        throw new Error(data.error || "画像生成に失敗しました");
      }

      debug.success(`画像生成完了 (${(totalTime / 1000).toFixed(2)}秒)`);

      const generatedInfo = await debug.getImageInfo(data.imageData);
      setDebugImageInfo((prev: any) => ({
        ...prev,
        generated: {
          size: generatedInfo.size,
          width: generatedInfo.dimensions.width,
          height: generatedInfo.dimensions.height,
        },
      }));

      setGeneratedImage(data.imageData);
      setState("result");
    } catch (err) {
      console.error("Generation error:", err);
      debug.error("画像生成エラー", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setState("preview");
    }
  }, [capturedImage]);

  // ポスター生成
  const handleGeneratePoster = useCallback(() => {
    generateImage("/api/generate-poster", "ポスター生成を開始します");
  }, [generateImage]);

  // リセット
  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
    setState("home");
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* デバッグパネル */}
      <DebugPanel imageInfo={debugImageInfo} apiInfo={debugApiInfo} />

      {/* ローディングオーバーレイ */}
      {state === "generating" && <GeneratingOverlay />}

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 非表示のcanvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ホーム画面 */}
      {state === "home" && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="main-container w-full max-w-md px-6 py-8 sm:px-8 sm:py-10">
            {/* 円形フレーム */}
            <div className="flex justify-center mb-8 relative">
              <div className="circular-frame flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""} ${!isStreaming ? "hidden" : ""}`}
                />
                {!isStreaming && (
                  <CameraIcon className="w-16 h-16 sm:w-20 sm:h-20 camera-icon" />
                )}
              </div>

              {/* カメラ切り替えボタン */}
              {isStreaming && (
                <button
                  onClick={toggleCamera}
                  className="absolute top-2 right-2 bg-white/80 text-lovot-text p-2 rounded-full hover:bg-white transition shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* ボタン */}
            {isStreaming ? (
              <div className="flex flex-col gap-3">
                {/* シャッターボタン */}
                <div className="flex justify-center">
                  <button onClick={capturePhoto} className="shutter-button">
                    <div className="shutter-button-inner" />
                  </button>
                </div>
                {/* キャンセル */}
                <button
                  onClick={stopCamera}
                  className="btn-secondary mx-auto"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={startCamera} className="btn-primary flex-1">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  いまのLOVOTを撮る
                </button>
                <button onClick={openFileSelector} className="btn-secondary flex-1">
                  <ImageIcon className="w-5 h-5" />
                  大切な1枚を選ぶ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* プレビュー画面 */}
      {state === "preview" && capturedImage && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="main-container w-full max-w-md px-6 py-8">
            <h2 className="text-xl font-bold text-lovot-text text-center mb-6">
              この写真でOK？
            </h2>

            <div className="flex justify-center mb-6">
              <div className="circular-frame">
                <img
                  src={`data:image/jpeg;base64,${capturedImage}`}
                  alt="撮影したLOVOT"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleRetake} className="btn-secondary flex-1">
                撮り直す
              </button>
              <button onClick={handleGeneratePoster} className="btn-primary flex-1">
                ポスターを作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 結果画面 */}
      {state === "result" && generatedImage && (
        <ResultDisplay imageData={generatedImage} onReset={handleReset} />
      )}
    </div>
  );
}
