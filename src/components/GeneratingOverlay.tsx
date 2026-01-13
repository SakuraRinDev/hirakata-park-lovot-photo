"use client";

import { motion } from "framer-motion";

// パーティクル（キラキラ）のコンポーネント
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 bg-lovot-gold rounded-full"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: [0, -30, -60],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

// ハートのコンポーネント
function FloatingHeart({ delay, startX }: { delay: number; startX: number }) {
  return (
    <motion.div
      className="absolute text-lovot-primary/60 text-lg"
      style={{ left: `${startX}%`, bottom: "20%" }}
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -100, -150, -200],
        x: [0, 10, -10, 5],
        scale: [0.5, 1, 1, 0.8],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    >
      ♡
    </motion.div>
  );
}

export default function GeneratingOverlay() {
  // パーティクルの配置
  const particles = [
    { delay: 0, x: 20, y: 30 },
    { delay: 0.5, x: 80, y: 25 },
    { delay: 1, x: 15, y: 60 },
    { delay: 1.5, x: 85, y: 55 },
    { delay: 0.3, x: 50, y: 20 },
    { delay: 0.8, x: 30, y: 70 },
    { delay: 1.2, x: 70, y: 65 },
  ];

  // ハートの配置
  const hearts = [
    { delay: 0, startX: 25 },
    { delay: 1, startX: 75 },
    { delay: 2, startX: 50 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-lovot-text/90 flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      {/* パーティクルエフェクト */}
      {particles.map((p, i) => (
        <Particle key={i} delay={p.delay} x={p.x} y={p.y} />
      ))}

      {/* フローティングハート */}
      {hearts.map((h, i) => (
        <FloatingHeart key={i} delay={h.delay} startX={h.startX} />
      ))}

      {/* 背景のグロー効果 */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-lovot-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* アニメーションロゴ */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        {/* 外側のパルスリング */}
        <motion.div
          className="absolute inset-0 w-24 h-24 rounded-full border-2 border-lovot-gold/50"
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.5, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.div
          className="absolute inset-0 w-24 h-24 rounded-full border-2 border-lovot-gold/50"
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.5, 0.3, 0],
          }}
          transition={{
            duration: 2,
            delay: 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* メインの円 */}
        <motion.div
          className="w-24 h-24 rounded-full bg-lovot-primary/30"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* スピナー */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full border-4 border-lovot-gold border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* LOVOTアイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.svg
            className="w-8 h-8 text-lovot-cream"
            viewBox="0 0 24 24"
            fill="currentColor"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <circle cx="12" cy="10" r="8" fill="currentColor" opacity="0.9" />
            <motion.circle
              cx="9"
              cy="9"
              r="1.5"
              fill="#5C4A3D"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="15"
              cy="9"
              r="1.5"
              fill="#5C4A3D"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
            />
            <ellipse cx="12" cy="2" rx="2" ry="1.5" fill="currentColor" />
          </motion.svg>
        </div>
      </motion.div>

      {/* テキスト */}
      <motion.div
        className="text-center text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.h2
          className="text-xl font-bold"
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          生成中...
        </motion.h2>
        <motion.p
          className="text-lovot-cream/70 text-sm mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          素敵なポスターを作成しています
        </motion.p>
      </motion.div>

      {/* プログレスドット */}
      <div className="flex gap-3 mt-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-lovot-gold"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* プログレスバー */}
      <motion.div
        className="mt-6 w-48 h-1 bg-white/20 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-lovot-gold to-lovot-primary rounded-full"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
