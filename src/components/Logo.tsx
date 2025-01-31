import { motion } from "framer-motion";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5"
        whileHover={{ scale: 1.1, rotate: 180 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 20,
        }}
      >
        <div className="absolute inset-[2px] rounded-[10px] bg-black/50 backdrop-blur-xl" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-white"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: 0.2,
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
      >
        Lumina
      </motion.div>
    </div>
  );
}
