"use client";

import { useState, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import ResultDisplay from "@/components/ResultDisplay";
import DebugPanel from "@/components/DebugPanel";
import ImageGallery from "@/components/ImageGallery";
import { resizeImage } from "@/lib/imageUtils";
import { debug } from "@/lib/debug";
import { saveImage } from "@/lib/imageStorage";

type AppState = "camera" | "preview" | "generating" | "result";

export default function Home() {
  const [state, setState] = useState<AppState>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ギャラリー表示
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);

  // デバッグ情報
  const [debugImageInfo, setDebugImageInfo] = useState<any>({});
  const [debugApiInfo, setDebugApiInfo] = useState<any>({});

  // 撮影完了
  const handleCapture = useCallback(async (imageData: string) => {
    debug.info("写真を撮影しました");

    // 画像情報を取得
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
    setState("camera");
    setError(null);
  }, []);

  // 合成開始（共通処理）
  const generateImage = useCallback(async (apiEndpoint: string, logMessage: string) => {
    if (!capturedImage) return;

    setState("generating");
    setError(null);

    const startTime = Date.now();
    debug.info(logMessage);

    try {
      // 画像をリサイズ（API負荷軽減）
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

      // API呼び出し
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

  // LOVOTキャラクター合成
  const handleGenerate = useCallback(() => {
    generateImage("/api/generate-multi", "画像合成を開始します");
  }, [generateImage]);

  // ポスター生成
  const handleGeneratePoster = useCallback(() => {
    generateImage("/api/generate-poster", "ポスター生成を開始します");
  }, [generateImage]);

  // フリーポスター生成（自由度高め）
  const handleFreePoster = useCallback(() => {
    generateImage("/api/generate-poster-free", "フリーポスター生成を開始します");
  }, [generateImage]);

  // エージェントポスター（2段階生成）
  const handleAgentPoster = useCallback(async () => {
    if (!capturedImage) return;

    setState("generating");
    setError(null);

    const startTime = Date.now();
    debug.info("エージェントポスター生成を開始します（2段階処理）");

    try {
      // 画像をリサイズ
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

      // ステップ1: ポーズ変更したLOVOT画像を生成
      debug.info("ステップ1: ポーズ変更LOVOT画像を生成中...");
      const step1Response = await fetch("/api/generate-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lovotImageBase64: resizedImage }),
      });

      const step1Data = await step1Response.json();

      if (!step1Response.ok) {
        throw new Error(step1Data.error || "ステップ1: LOVOT画像生成に失敗");
      }

      debug.success("ステップ1完了: LOVOT画像生成成功");

      // ステップ1の結果を自動保存（IndexedDB）
      await saveImage({
        imageData: step1Data.imageData,
        model: "gemini-3-pro",
        modelName: "エージェント Step1",
        originalImage: resizedImage,
      });
      // ステップ1の結果をローカルファイルに保存
      const timestamp1 = new Date().toISOString().replace(/[:.]/g, "-");
      await fetch("/api/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: step1Data.imageData,
          filename: `agent_step1_${timestamp1}.png`,
        }),
      });
      debug.info("ステップ1の画像を保存しました（ローカル + IndexedDB）");
      setGalleryRefreshTrigger((prev) => prev + 1);

      // ステップ2: 生成したLOVOT画像をポスターに合成
      debug.info("ステップ2: ポスターに合成中...");
      const step2Response = await fetch("/api/generate-poster-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedLovotImageBase64: step1Data.imageData }),
      });

      const step2Data = await step2Response.json();

      if (!step2Response.ok) {
        throw new Error(step2Data.error || "ステップ2: ポスター合成に失敗");
      }

      const totalTime = Date.now() - startTime;
      debug.success(`エージェントポスター完了 (${(totalTime / 1000).toFixed(2)}秒)`);

      setDebugApiInfo({
        requestTime: startTime,
        responseTime: Date.now(),
        totalTime,
        status: step2Response.status,
      });

      const generatedInfo = await debug.getImageInfo(step2Data.imageData);
      setDebugImageInfo((prev: any) => ({
        ...prev,
        generated: {
          size: generatedInfo.size,
          width: generatedInfo.dimensions.width,
          height: generatedInfo.dimensions.height,
        },
      }));

      // ステップ2の結果を自動保存（IndexedDB）
      await saveImage({
        imageData: step2Data.imageData,
        model: "gemini-3-pro",
        modelName: "エージェント Step2",
        originalImage: resizedImage,
      });
      // ステップ2の結果をローカルファイルに保存
      const timestamp2 = new Date().toISOString().replace(/[:.]/g, "-");
      await fetch("/api/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: step2Data.imageData,
          filename: `agent_step2_${timestamp2}.png`,
        }),
      });
      debug.info("ステップ2の画像を保存しました（ローカル + IndexedDB）");
      setGalleryRefreshTrigger((prev) => prev + 1);

      setGeneratedImage(step2Data.imageData);
      setState("result");
    } catch (err) {
      console.error("Agent poster error:", err);
      debug.error("エージェントポスターエラー", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setState("preview");
    }
  }, [capturedImage]);

  // リセット
  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
    setState("camera");
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-hirakata-light">
      {/* デバッグパネル */}
      <DebugPanel imageInfo={debugImageInfo} apiInfo={debugApiInfo} />

      {/* ローディングオーバーレイ */}
      {state === "generating" && <GeneratingOverlay />}

      {/* カメラ画面 */}
      {state === "camera" && <CameraCapture onCapture={handleCapture} />}

      {/* プレビュー画面 */}
      {state === "preview" && capturedImage && (
        <div className="flex flex-col items-center gap-4 p-4">
          <h2 className="text-lg font-bold text-hirakata-dark">
            この写真でOK？
          </h2>

          {/* プレビュー画像 */}
          <div className="w-full max-w-md">
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="撮影したLovot"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center w-full max-w-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            <div className="flex gap-4">
              <button onClick={handleRetake} className="flex-1 btn-secondary">
                撮り直す
              </button>
              <button onClick={handleGenerate} className="flex-1 btn-primary">
                合成する！
              </button>
            </div>
            <button
              onClick={handleGeneratePoster}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition"
            >
              🎡 ポスターを作る！
            </button>
            <button
              onClick={handleAgentPoster}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              🤖 エージェントポスター
            </button>
            <button
              onClick={handleFreePoster}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-teal-600 hover:to-cyan-600 transition"
            >
              🎨 フリーポスター
            </button>
          </div>
        </div>
      )}

      {/* 結果画面 */}
      {state === "result" && generatedImage && (
        <ResultDisplay
          imageData={generatedImage}
          originalImage={capturedImage || undefined}
          onReset={handleReset}
          onSaved={() => setGalleryRefreshTrigger((prev) => prev + 1)}
        />
      )}

      {/* ギャラリーボタン（固定位置） */}
      <button
        onClick={() => setIsGalleryOpen(true)}
        className="fixed bottom-4 right-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition z-40"
        title="保存した画像を見る"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </button>

      {/* ギャラリーモーダル */}
      <ImageGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        refreshTrigger={galleryRefreshTrigger}
      />
    </div>
  );
}
