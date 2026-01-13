"use client";

import { downloadImage } from "@/lib/imageUtils";
import { motion } from "framer-motion";

interface ResultDisplayProps {
  imageData: string;
}

// アニメーション設定
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

const imageVariants = {
  initial: { scale: 0.8, opacity: 0, rotateY: -15 },
  animate: {
    scale: 1,
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.7,
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
    scale: 1.03,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.97 }
};

export default function ResultDisplay({
  imageData,
}: ResultDisplayProps) {
  // ダウンロード（iOS対応：Web Share APIを優先使用）
  const handleDownload = async () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `lovot-memory-${timestamp}.png`;

    // iOS/モバイルの場合、Web Share APIを使用して写真フォルダに保存可能にする
    if (navigator.share && navigator.canShare) {
      try {
        // Base64をBlobに変換
        const response = await fetch(`data:image/png;base64,${imageData}`);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: "image/png" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
          });
          return;
        }
      } catch (error) {
        // シェアがキャンセルされた場合は何もしない
        if ((error as Error).name === "AbortError") {
          return;
        }
        // それ以外のエラーはフォールバック
      }
    }

    // フォールバック：通常のダウンロード
    downloadImage(imageData, filename);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="main-container w-full max-w-md px-6 py-8"
      >
        {/* 完成メッセージ */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <motion.h2
            className="text-2xl font-bold text-lovot-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            Completed!
          </motion.h2>
        </motion.div>

        {/* 生成画像 */}
        <motion.div
          variants={imageVariants}
          className="mb-6 perspective-1000"
        >
          <motion.img
            src={`data:image/png;base64,${imageData}`}
            alt="合成された写真"
            className="w-full rounded-2xl shadow-lg"
            whileHover={{
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* アクションボタン */}
        <motion.div variants={itemVariants} className="space-y-3">
          {/* ダウンロードボタン（iOSでは写真フォルダに保存可能） */}
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleDownload}
            className="w-full btn-primary"
          >
            <motion.svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </motion.svg>
            保存する
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
