"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface BeforeAfterPreviewProps {
  beforeImage?: string;
  afterImage?: string;
  interval?: number;
}

export default function BeforeAfterPreview({
  beforeImage = "/sample-lovot.png",
  afterImage = "/generated-images/agent_step2_2026-01-13T07-52-32-996Z.png",
  interval = 3000,
}: BeforeAfterPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowAfter((prev) => !prev);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  // beforeImage がない場合はダミープレースホルダーを表示
  const hasBefore = !!beforeImage;

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {showAfter ? (
          <motion.div
            key="after"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Image
              src={afterImage}
              alt="完成イメージ"
              fill
              className="object-cover rounded-full"
              sizes="(max-width: 640px) 200px, 240px"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-lovot-text/70 to-transparent p-3 rounded-b-full">
              <span className="text-white text-xs font-medium block text-center">
                こうなります！
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="before"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {hasBefore ? (
              <Image
                src={beforeImage}
                alt="撮影例"
                fill
                className="object-cover rounded-full"
                sizes="(max-width: 640px) 200px, 240px"
              />
            ) : (
              // ダミープレースホルダー
              <div className="w-full h-full bg-lovot-beige rounded-full flex items-center justify-center">
                <div className="text-center text-lovot-text/60">
                  <svg
                    className="w-16 h-16 mx-auto mb-2 opacity-50"
                    viewBox="0 0 48 48"
                    fill="currentColor"
                  >
                    <circle cx="24" cy="20" r="14" />
                    <circle cx="19" cy="17" r="2.5" fill="#FFF8F0" />
                    <circle cx="29" cy="17" r="2.5" fill="#FFF8F0" />
                    <ellipse cx="24" cy="6" rx="3" ry="2" />
                  </svg>
                  <span className="text-xs">LOVOT</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-lovot-text/70 to-transparent p-3 rounded-b-full">
              <span className="text-white text-xs font-medium block text-center">
                こんな写真が...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
