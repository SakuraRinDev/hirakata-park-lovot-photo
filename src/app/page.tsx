"use client";

import { useState, useCallback, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import ResultDisplay from "@/components/ResultDisplay";
import DebugPanel from "@/components/DebugPanel";
import MusicPlayer from "@/components/MusicPlayer";
import { resizeImage } from "@/lib/imageUtils";
import { debug } from "@/lib/debug";

// アニメーション設定
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.3 }
  }
};

const containerVariants = {
  initial: { opacity: 0, scale: 0.95, backdropFilter: "blur(0px)" },
  animate: {
    opacity: 1,
    scale: 1,
    backdropFilter: "blur(10px)",
    transition: {
      duration: 1,
      ease: "easeOut" as const,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

const circularFrameVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1] as const
    }
  }
};

const buttonVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

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
      debug.info("画像をリサイズ中（長辺512px）...");
      const resizedImage = await resizeImage(capturedImage, 512);

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
      {/* BGM */}
      <MusicPlayer />

      {/* デバッグパネル */}
      <DebugPanel imageInfo={debugImageInfo} apiInfo={debugApiInfo} />

      {/* ローディングオーバーレイ */}
      <AnimatePresence>
        {state === "generating" && <GeneratingOverlay />}
      </AnimatePresence>

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

      <AnimatePresence mode="wait">
        {/* ホーム画面 */}
        {state === "home" && (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-4 py-8"
          >
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="main-container w-full max-w-md px-6 py-8 sm:px-8 sm:py-10"
            >
              {/* 円形フレーム */}
              <motion.div
                variants={circularFrameVariants}
                className="flex justify-center mb-8 relative"
              >
                <div className="circular-frame flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""} ${!isStreaming ? "hidden" : ""}`}
                  />
                  {!isStreaming && (
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <CameraIcon className="w-16 h-16 sm:w-20 sm:h-20 camera-icon" />
                    </motion.div>
                  )}
                </div>

                {/* カメラ切り替えボタン */}
                <AnimatePresence>
                  {isStreaming && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleCamera}
                      className="absolute top-2 right-2 bg-white/80 text-lovot-text p-2 rounded-full hover:bg-white transition shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ボタン */}
              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div
                    key="streaming-buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col gap-3"
                  >
                    {/* シャッターボタン */}
                    <motion.div
                      className="flex justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <motion.button
                        onClick={capturePhoto}
                        className="shutter-button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                      >
                        <motion.div
                          className="shutter-button-inner"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(200, 91, 82, 0.4)",
                              "0 0 0 12px rgba(200, 91, 82, 0)",
                              "0 0 0 0 rgba(200, 91, 82, 0)"
                            ]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      </motion.button>
                    </motion.div>
                    {/* キャンセル */}
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={stopCamera}
                      className="btn-secondary mx-auto"
                    >
                      キャンセル
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="initial-buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={startCamera}
                      className="btn-primary flex-1"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      いまのLOVOTを撮る
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={openFileSelector}
                      className="btn-secondary flex-1"
                    >
                      <ImageIcon className="w-5 h-5" />
                      大切な1枚を選ぶ
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* プレビュー画面 */}
        {state === "preview" && capturedImage && (
          <motion.div
            key="preview"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-4 py-8"
          >
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="main-container w-full max-w-md px-6 py-8"
            >
              <motion.h2
                variants={itemVariants}
                className="text-xl font-bold text-lovot-text text-center mb-6"
              >
                この写真でOK？
              </motion.h2>

              <motion.div
                variants={circularFrameVariants}
                className="flex justify-center mb-6"
              >
                <div className="circular-frame overflow-hidden">
                  <motion.img
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    src={`data:image/jpeg;base64,${capturedImage}`}
                    alt="撮影したLOVOT"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-4 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleRetake}
                  className="btn-secondary flex-1"
                >
                  撮り直す
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleGeneratePoster}
                  className="btn-primary flex-1"
                >
                  ポスターを作成
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* 結果画面 */}
        {state === "result" && generatedImage && (
          <motion.div
            key="result"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1"
          >
            <ResultDisplay imageData={generatedImage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
