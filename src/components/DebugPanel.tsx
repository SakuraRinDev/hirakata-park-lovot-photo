"use client";

import { useState, useEffect } from "react";
import { debug, DebugLog } from "@/lib/debug";

interface DebugPanelProps {
  imageInfo?: {
    captured?: { size: number; width: number; height: number };
    resized?: { size: number; width: number; height: number };
    generated?: { size: number; width: number; height: number };
  };
  apiInfo?: {
    requestTime?: number;
    responseTime?: number;
    totalTime?: number;
    status?: number;
  };
}

export default function DebugPanel({ imageInfo, apiInfo }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  // Check debug mode after hydration to avoid SSR mismatch
  useEffect(() => {
    setShowPanel(debug.isEnabled());
  }, []);

  useEffect(() => {
    if (!showPanel) return;
    const interval = setInterval(() => {
      setLogs([...debug.getLogs()]);
    }, 500);
    return () => clearInterval(interval);
  }, [showPanel]);

  if (!showPanel) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getLogIcon = (type: DebugLog["type"]) => {
    switch (type) {
      case "info":
        return "ℹ️";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
    }
  };

  const getLogColor = (type: DebugLog["type"]) => {
    switch (type) {
      case "info":
        return "text-blue-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "success":
        return "text-green-600";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-300">
      {/* ヘッダー */}
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <h3 className="font-bold">Debug Mode</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-gray-300"
        >
          {isOpen ? "−" : "+"}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 max-h-96 overflow-y-auto text-xs">
          {/* 画像情報 */}
          {imageInfo && (
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2">📸 画像情報</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                {imageInfo.captured && (
                  <div>
                    <span className="font-semibold">撮影:</span>{" "}
                    {imageInfo.captured.width}x{imageInfo.captured.height} (
                    {formatBytes(imageInfo.captured.size)})
                  </div>
                )}
                {imageInfo.resized && (
                  <div>
                    <span className="font-semibold">リサイズ後:</span>{" "}
                    {imageInfo.resized.width}x{imageInfo.resized.height} (
                    {formatBytes(imageInfo.resized.size)})
                  </div>
                )}
                {imageInfo.generated && (
                  <div>
                    <span className="font-semibold">生成画像:</span>{" "}
                    {imageInfo.generated.width}x{imageInfo.generated.height} (
                    {formatBytes(imageInfo.generated.size)})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API情報 */}
          {apiInfo && (
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2">⚡ API情報</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                {apiInfo.requestTime && (
                  <div>
                    <span className="font-semibold">リクエスト送信:</span>{" "}
                    {new Date(apiInfo.requestTime).toLocaleTimeString()}
                  </div>
                )}
                {apiInfo.responseTime && (
                  <div>
                    <span className="font-semibold">レスポンス受信:</span>{" "}
                    {new Date(apiInfo.responseTime).toLocaleTimeString()}
                  </div>
                )}
                {apiInfo.totalTime && (
                  <div>
                    <span className="font-semibold">処理時間:</span>{" "}
                    {(apiInfo.totalTime / 1000).toFixed(2)}秒
                  </div>
                )}
                {apiInfo.status && (
                  <div>
                    <span className="font-semibold">ステータス:</span>{" "}
                    <span
                      className={
                        apiInfo.status === 200
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {apiInfo.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ログ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-700">📋 ログ</h4>
              <button
                onClick={() => {
                  debug.clearLogs();
                  setLogs([]);
                }}
                className="text-xs text-red-600 hover:underline"
              >
                クリア
              </button>
            </div>
            <div className="bg-gray-50 p-2 rounded space-y-1 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-400 text-center py-2">
                  ログがありません
                </div>
              ) : (
                logs.slice(-10).reverse().map((log, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-1 last:border-b-0"
                  >
                    <div className="flex items-start gap-1">
                      <span>{getLogIcon(log.type)}</span>
                      <div className="flex-1">
                        <div className={`font-semibold ${getLogColor(log.type)}`}>
                          {log.message}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        {log.data && (
                          <pre className="text-[10px] bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
