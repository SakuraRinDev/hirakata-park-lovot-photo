"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllImages, deleteImage, clearAllImages, SavedImage } from "@/legacy/lib/imageStorage";
import { downloadImage } from "@/lib/imageUtils";

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

export default function ImageGallery({ isOpen, onClose, refreshTrigger }: ImageGalleryProps) {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 画像を読み込み
  const loadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const allImages = await getAllImages();
      setImages(allImages);
    } catch (error) {
      console.error("画像の読み込みに失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 開いた時と保存時に読み込み
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, refreshTrigger, loadImages]);

  // 画像を削除
  const handleDelete = async (id: string) => {
    if (!confirm("この画像を削除しますか？")) return;

    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("削除に失敗しました:", error);
      alert("削除に失敗しました");
    }
  };

  // 全て削除
  const handleClearAll = async () => {
    if (!confirm("全ての画像を削除しますか？この操作は取り消せません。")) return;

    try {
      await clearAllImages();
      setImages([]);
      setSelectedImage(null);
    } catch (error) {
      console.error("削除に失敗しました:", error);
      alert("削除に失敗しました");
    }
  };

  // ダウンロード
  const handleDownload = (image: SavedImage) => {
    const date = new Date(image.createdAt).toISOString().slice(0, 10);
    downloadImage(image.imageData, `lovot-${image.model}-${date}.png`);
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            保存した画像 ({images.length})
          </h2>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-1"
              >
                全て削除
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hirakata-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>保存した画像はありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={`data:image/png;base64,${image.imageData}`}
                    alt={`${image.modelName}で生成`}
                    className="w-full aspect-square object-cover rounded-lg shadow-md hover:shadow-lg transition"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition flex items-end">
                    <div className="w-full p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition">
                      <p className="text-white text-xs font-medium truncate">{image.modelName}</p>
                      <p className="text-white/70 text-xs">{formatDate(image.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl max-w-2xl w-full m-4 overflow-hidden">
            <div className="relative">
              <img
                src={`data:image/png;base64,${selectedImage.imageData}`}
                alt="選択された画像"
                className="w-full"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-800">{selectedImage.modelName}</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedImage.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  ダウンロード
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedImage.id);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
