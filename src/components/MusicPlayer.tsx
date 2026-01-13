"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 初回インタラクションで自動再生を試みる
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        setHasInteracted(true);
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // 自動再生がブロックされた場合は何もしない
        });
      }
    };

    // ページ読み込み時に自動再生を試みる
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasInteracted(true);
      }).catch(() => {
        // 自動再生がブロックされた場合、ユーザーインタラクションを待つ
        document.addEventListener("click", handleFirstInteraction, { once: true });
        document.addEventListener("touchstart", handleFirstInteraction, { once: true });
      });
    }

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [hasInteracted]);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/Clay Teacup Parade.wav"
        loop
        preload="auto"
      />
      <motion.button
        onClick={toggleMusic}
        className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-lovot-brown/20 hover:bg-white transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        aria-label={isPlaying ? "音楽を停止" : "音楽を再生"}
      >
        {isPlaying ? (
          // スピーカーオンアイコン
          <svg className="w-6 h-6 text-lovot-brown" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          // スピーカーオフアイコン
          <svg className="w-6 h-6 text-lovot-text/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.button>
    </>
  );
}
