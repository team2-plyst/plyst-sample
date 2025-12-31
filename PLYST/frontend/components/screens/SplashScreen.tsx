import { motion } from "motion/react";
import { Music2 } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="min-h-screen w-full aurora-bg flex flex-col items-center justify-center">
      {/* Stars overlay */}
      <div className="stars" />
      
      {/* Aurora Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.8,
        }}
        className="relative z-10 aurora-glass rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4"
      >
        {/* Logo with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1,
            delay: 0.2,
          }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(0, 255, 135, 0.3)",
                  "0 0 50px rgba(0, 255, 135, 0.5), 0 0 80px rgba(0, 212, 170, 0.3)",
                  "0 0 20px rgba(0, 255, 135, 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 backdrop-blur-lg border border-emerald-400/30 rounded-3xl p-8"
            >
              <Music2 className="w-20 h-20 text-emerald-300" strokeWidth={1.5} />
            </motion.div>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="aurora-text text-5xl text-center font-bold mb-3"
        >
          PLYST
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-emerald-200/70 text-center mb-10"
        >
          당신의 음악, 당신의 감정
        </motion.p>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex justify-center gap-2 mb-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
            />
          ))}
        </motion.div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-emerald-300/60 text-center text-sm"
        >
          로딩 중...
        </motion.p>
      </motion.div>

    </div>
  );
}