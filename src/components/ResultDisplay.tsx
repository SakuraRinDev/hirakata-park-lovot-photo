"use client";

import { downloadImage } from "@/lib/imageUtils";
import { motion } from "framer-motion";

interface ResultDisplayProps {
  imageData: string;
  onReset: () => void;
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

const celebrationVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15
    }
  }
};

export default function ResultDisplay({
  imageData,
  onReset,
}: ResultDisplayProps) {
  // ダウンロード
  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadImage(imageData, `lovot-memory-${timestamp}.png`);
  };

  // Xでシェア
  const handleShareX = () => {
    const shareText = "#LOVOT✖️ひらかたパーク";
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank");
  };

  // Instagramでシェア
  const handleShareInstagram = () => {
    window.open("https://instagram.com", "_blank");
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
          <motion.div
            variants={celebrationVariants}
            className="inline-block mb-2"
          >
            <span className="text-4xl">✨</span>
          </motion.div>
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
            完成！
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
          {/* ダウンロードボタン */}
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
            ダウンロード
          </motion.button>

          {/* シェアボタン */}
          <motion.div
            variants={itemVariants}
            className="flex gap-3"
          >
            {/* X */}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleShareX}
              className="flex-1 bg-black text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </motion.button>

            {/* Instagram */}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleShareInstagram}
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </motion.button>
          </motion.div>

        </motion.div>

        {/* もう一度ボタン */}
        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onReset}
            className="btn-secondary"
          >
            もう一度作る
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
