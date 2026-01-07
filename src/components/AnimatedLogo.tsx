import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AnimatedLogo({ className, size = "md" }: AnimatedLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  // Animation timing (in seconds)
  const strokeDuration = 1.0;
  const fillDelay = 0.8;
  const fillDuration = 0.4;
  const glowDelay = 1.2;
  const glowDuration = 0.4;

  return (
    <motion.div
      className={cn("relative inline-block", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {/* Glow effect layer */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: glowDelay, duration: glowDuration, ease: "easeOut" }}
        style={{
          filter: "blur(12px)",
          background: "linear-gradient(135deg, rgba(0, 64, 143, 0.3), rgba(63, 167, 224, 0.2))",
          transform: "scale(1.1)",
        }}
      />
      
      {/* SVG Logo with stroke animation */}
      <motion.svg
        viewBox="0 0 4870 1021"
        className={cn(sizeClasses[size], "w-auto relative z-10")}
        initial="hidden"
        animate="visible"
      >
        <defs>
          <linearGradient id="animated-gradient-main" x1="1120.5" y1="137.1" x2="1120.5" y2="803.7" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00357a"/>
            <stop offset=".2" stopColor="#005ca4"/>
            <stop offset=".3" stopColor="#0461a8"/>
            <stop offset=".4" stopColor="#1070b4"/>
            <stop offset=".5" stopColor="#3fa7e0"/>
            <stop offset=".6" stopColor="#2689c8"/>
            <stop offset=".7" stopColor="#0461a8"/>
            <stop offset="1" stopColor="#003b85"/>
          </linearGradient>
          <linearGradient id="animated-gradient-text" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0" stopColor="#00357a"/>
            <stop offset=".3" stopColor="#005ca4"/>
            <stop offset=".5" stopColor="#3fa7e0"/>
            <stop offset=".7" stopColor="#005ca4"/>
            <stop offset="1" stopColor="#003b85"/>
          </linearGradient>
        </defs>

        {/* Main ellipse shape - stroke animation */}
        <motion.ellipse
          cx="1120.5"
          cy="470.4"
          rx="978.5"
          ry="333.3"
          fill="none"
          stroke="url(#animated-gradient-main)"
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ 
            pathLength: { duration: strokeDuration, ease: "easeOut" },
            opacity: { duration: 0.2 }
          }}
        />

        {/* Fill layer - fades in after stroke */}
        <motion.ellipse
          cx="1120.5"
          cy="470.4"
          rx="978.5"
          ry="333.3"
          fill="url(#animated-gradient-main)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: fillDelay, duration: fillDuration, ease: "easeOut" }}
        />

        {/* INJEDIESEL text paths - stroke animation */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.1 }}
        >
          {/* I */}
          <motion.path
            d="M389.5,348.7h208.9v263.4H389.5V348.7Z M389.5,303.2h208.9v33.5H389.5V303.2Z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: strokeDuration * 0.8, delay: 0.1, ease: "easeOut" }}
          />
          <motion.path
            d="M389.5,348.7h208.9v263.4H389.5V348.7Z M389.5,303.2h208.9v33.5H389.5V303.2Z"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: fillDelay, duration: fillDuration, ease: "easeOut" }}
          />

          {/* N */}
          <motion.path
            d="M873.7,349.1l.5,24.2c14.6-9.7,32.6-16.9,53.8-21.7,21.4-4.8,45.9-7.2,73.7-7.2s63.2,3.2,85.4,9.7c22.1,6.4,36.3,14.6,42.7,24.4,6.3,9.9,9.4,26.3,9.4,49.3v184.4h-202.8v-182.1c0-18.1-1.5-29.2-4.6-33.2-2.9-3.9-11.3-6-25-6s-23.5,2.3-27.1,6.9c-3.8,4.5-5.5,16.7-5.5,36.5v177.8h-202.9v-263.1h202.4Z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: strokeDuration * 0.8, delay: 0.15, ease: "easeOut" }}
          />
          <motion.path
            d="M873.7,349.1l.5,24.2c14.6-9.7,32.6-16.9,53.8-21.7,21.4-4.8,45.9-7.2,73.7-7.2s63.2,3.2,85.4,9.7c22.1,6.4,36.3,14.6,42.7,24.4,6.3,9.9,9.4,26.3,9.4,49.3v184.4h-202.8v-182.1c0-18.1-1.5-29.2-4.6-33.2-2.9-3.9-11.3-6-25-6s-23.5,2.3-27.1,6.9c-3.8,4.5-5.5,16.7-5.5,36.5v177.8h-202.9v-263.1h202.4Z"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: fillDelay, duration: fillDuration, ease: "easeOut" }}
          />

          {/* J */}
          <motion.path
            d="M1424.1,346.3v235.4c0,27.7-1.2,46.4-3.8,56.2-2.6,9.8-10.3,18.4-23.1,25.8-12.9,7.4-30.2,12.9-51.8,16.5-21.6,3.5-54,5.4-97.2,5.4h-78.3v-47.5c24.2,0,37.7-1.2,40.8-3.6,2.9-2.4,4.5-17.4,4.5-44.9v-243.3h208.9Z M1215.2,304.1h208.9v31.7h-208.9v-31.7Z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: strokeDuration * 0.8, delay: 0.2, ease: "easeOut" }}
          />
          <motion.path
            d="M1424.1,346.3v235.4c0,27.7-1.2,46.4-3.8,56.2-2.6,9.8-10.3,18.4-23.1,25.8-12.9,7.4-30.2,12.9-51.8,16.5-21.6,3.5-54,5.4-97.2,5.4h-78.3v-47.5c24.2,0,37.7-1.2,40.8-3.6,2.9-2.4,4.5-17.4,4.5-44.9v-243.3h208.9Z M1215.2,304.1h208.9v31.7h-208.9v-31.7Z"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: fillDelay, duration: fillDuration, ease: "easeOut" }}
          />

          {/* E (first) */}
          <motion.path
            d="M1953.7,481.6v-31c0-24.7-6.2-43.9-21.1-57.5-14.9-13.6-40.1-24.6-77.1-32.9-37-8.3-83.6-12.4-140.5-12.4s-87.4,3.4-123.2,10.3c-35.8,6.8-62.2,16.7-78,29.6-15.6,12.9-24,30.4-24,52.7v74.4c0,19,4,33.4,11,43.4,7,9.9,20,19,38.3,27.3,18.2,8.3,43.8,14.8,76.6,19.5,32.9,4.7,70.7,7.1,113.5,7.1s81.1-2.4,110.2-7.2c29.3-4.8,53.5-12,72.7-21.6,19-9.6,29.8-18.6,35-27.1,5.1-8.5,6.5-20.6,6.5-36.3v-18.9h-190.1v33.8c0,12.7-2.5,21.2-7.6,25.6-5.1,4.4-15.3,6.6-30.7,6.6s-20.9-1.7-25.3-5c-4.3-3.3-6.7-10.8-6.7-22.3v-58h260.4Z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: strokeDuration * 0.8, delay: 0.25, ease: "easeOut" }}
          />
          <motion.path
            d="M1953.7,481.6v-31c0-24.7-6.2-43.9-21.1-57.5-14.9-13.6-40.1-24.6-77.1-32.9-37-8.3-83.6-12.4-140.5-12.4s-87.4,3.4-123.2,10.3c-35.8,6.8-62.2,16.7-78,29.6-15.6,12.9-24,30.4-24,52.7v74.4c0,19,4,33.4,11,43.4,7,9.9,20,19,38.3,27.3,18.2,8.3,43.8,14.8,76.6,19.5,32.9,4.7,70.7,7.1,113.5,7.1s81.1-2.4,110.2-7.2c29.3-4.8,53.5-12,72.7-21.6,19-9.6,29.8-18.6,35-27.1,5.1-8.5,6.5-20.6,6.5-36.3v-18.9h-190.1v33.8c0,12.7-2.5,21.2-7.6,25.6-5.1,4.4-15.3,6.6-30.7,6.6s-20.9-1.7-25.3-5c-4.3-3.3-6.7-10.8-6.7-22.3v-58h260.4Z"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: fillDelay, duration: fillDuration, ease: "easeOut" }}
          />
        </motion.g>

        {/* DIESEL text and remaining elements */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: fillDelay + 0.1, duration: fillDuration, ease: "easeOut" }}
        >
          {/* Blue gradient bar */}
          <rect x="2656.4" y="305" width="201" height="32" fill="#004d98"/>
          <rect x="2656.3" y="343.4" width="201" height="266.3" fill="url(#animated-gradient-text)"/>
          
          {/* POWERCHIP text at bottom */}
          <path fill="#00408f" d="M4585.5,750.5h-248.8v135h35.7v-53.3h213.1c12,0,20.5-8.9,20.5-18.5v-44.7c0-9.5-8.6-18.5-20.5-18.5ZM4560.7,800.7h-188.4v-15.2h188.4c4.8,0,7.8,3.9,7.8,7.6s-3.1,7.6-7.8,7.6Z"/>
          <rect fill="#00408f" x="4281.2" y="750.6" width="37.5" height="134.9"/>
          <polygon fill="#00408f" points="4225.1 800.3 4035.2 800.3 4035.2 750.6 3997.7 750.6 3997.7 885.5 4035.2 885.5 4035.2 834 4225.1 834 4225.1 885.5 4262.7 885.5 4262.7 750.6 4225.1 750.6 4225.1 800.3"/>
          <path fill="#00408f" d="M3710.9,776.8v82.5c0,13.5,12,26.3,29,26.3h238.4v-37.7h-223.8c-2,0-3.1-1.8-3.1-3.3v-53.1c0-1.4,1.2-3.3,3.1-3.3h223.8v-37.7h-238.4c-17,0-29,12.8-29,26.3Z"/>
          <path fill="#00408f" d="M3524.2,832.2c12,0,20.5-8.9,20.5-18.5v-44.7c0-9.5-8.6-18.5-20.5-18.5h-246.6v135h35.7v-53.3h171.2l26.2,53.3h39.6l-26.2-53.3h.2ZM3499.4,800.7h-186.2v-15.2h186.2c4.8,0,7.8,3.9,7.8,7.6s-3.1,7.6-7.8,7.6Z"/>
          <polygon fill="#00408f" points="2994.7 885.5 3265 885.5 3265 847.2 3035 847.2 3035 830.5 3265 830.5 3265 798.7 3035 798.7 3035 782.3 3265 782.3 3265 750.6 2994.7 750.6 2994.7 885.5"/>
          <path fill="#00408f" d="M2938.8,842.2c0,2.8-2.3,5.9-6,5.9h-68.1v-97.6h-38.3v97.6h-68.1c-3.7,0-6-3.1-6-5.9v-91.7h-39.7v112.3c0,11.7,10.4,22.7,25.1,22.7h218.2c14.7,0,25.1-11,25.1-22.7v-112.3h-42.1v91.7Z"/>
          <path fill="#00408f" d="M2667.5,750.6h-210.2c-17,0-29,12.8-29,26.3v82.5c0,13.5,12,26.3,29,26.3h210.2c17,0,29-12.8,29-26.3v-82.5c0-13.5-12-26.3-29-26.3ZM2656,844.6c0,1.4-1.2,3.3-3.1,3.3h-181c-2,0-3.1-1.8-3.1-3.3v-53.1c0-1.4,1.2-3.3,3.1-3.3h181c2,0,3.1,1.8,3.1,3.3v53.1Z"/>
          <path fill="#00408f" d="M2392.9,750.5h-246.6v135h35.7v-53.3h211c12,0,20.5-8.9,20.5-18.5v-44.7c0-9.5-8.5-18.5-20.5-18.5ZM2368.1,800.7h-186.2v-15.2h186.2c4.8,0,7.8,3.9,7.8,7.6s-3.1,7.6-7.8,7.6Z"/>
        </motion.g>

        {/* Red "PERFORMANCE" text */}
        <motion.path
          fill="#bf0811"
          d="M4523.5,641.7h81.9l-4.8,15.8h-51.2l-3.5,11.8h47.5l-4.5,15.1h-47.5l-4.4,14.6h52.7l-5,16.7h-83.4l22.3-73.9ZM4468.7,685.4l25,6c-3.5,5.6-7.7,10.3-12.8,14.1-5,3.8-10.7,6.6-17,8.5-6.3,1.9-13.9,2.9-22.8,2.9s-19.2-1.2-25.4-3.5c-6.1-2.3-10.8-6.5-14-12.3-3.2-5.9-3.4-13.4-.7-22.6,3.7-12.2,10.9-21.6,21.6-28.2,10.7-6.6,24-9.8,40-9.8s21.7,1.9,27.8,5.6c6,3.8,9.6,9.6,10.7,17.4l-28.3,4.5c-.3-2.2-.8-3.9-1.5-4.9-1.2-1.7-2.9-3.1-5.1-4-2.2-.9-4.8-1.4-7.9-1.4-7,0-12.9,2.1-17.9,6.2-3.7,3.1-6.6,7.9-8.6,14.5-2.5,8.2-2.5,13.8,0,16.8,2.4,3,6.7,4.5,12.7,4.5s10.7-1.2,14.4-3.7c3.7-2.4,7-6,9.7-10.7ZM4300.8,641.7h28.6l24.9,40.8,12.3-40.8h28.9l-22.3,73.9h-28.9l-24.7-40.6-12.2,40.6h-28.8l22.3-73.9ZM4233.6,687.4l-2.8-26.6-18.9,26.6h21.7ZM4235.3,703.4h-34.7l-8.7,12.2h-31.3l59.6-73.9h33.5l14.9,73.9h-32.1l-1.3-12.2ZM4062,641.7h40.4l1.8,45,29-45h40.2l-22.3,73.9h-25l17-56.4-36.3,56.4h-22.7l-2.3-56.4-17,56.4h-25l22.3-73.9ZM3976.8,671.7h12.9c1.4,0,4.2-.3,8.4-1,2.1-.3,4-1.1,5.7-2.3,1.7-1.3,2.7-2.7,3.2-4.3.7-2.4.3-4.2-1.4-5.5-1.6-1.3-5.3-1.9-10.9-1.9h-13.5l-4.5,15.1ZM3932.8,715.6l22.3-73.9h51c9.5,0,16.5.6,21.1,1.8,4.6,1.2,8,3.5,10.1,6.7,2.1,3.3,2.4,7.3,1,12-1.2,4.1-3.5,7.6-6.7,10.6-3.2,3-7.2,5.4-11.9,7.3-3,1.2-6.9,2.2-11.6,2.9,3.4.9,5.8,1.8,7.1,2.7.9.6,2.2,1.9,3.7,3.9,1.5,2,2.5,3.5,2.9,4.6l8.4,21.4h-34.6l-9.6-22.5c-1.2-2.9-2.5-4.8-3.8-5.7-1.9-1.1-4.2-1.7-7-1.7h-2.7l-9,29.9h-30.7ZM3855,678.8c-2.2,7.5-2,12.8.7,16.1,2.8,3.3,7.3,4.9,13.7,4.9s12.2-1.6,16.7-4.8c4.6-3.2,8.1-8.9,10.6-17.2,2.1-7,1.7-12-1.1-15.2-2.8-3.2-7.4-4.8-13.9-4.8s-11.7,1.6-16.4,4.9c-4.7,3.3-8.2,8.7-10.5,16.2ZM3824.4,678.7c3.6-12.1,11-21.5,22-28.2,11-6.7,24.6-10.1,40.7-10.1s28.2,3.3,35.1,9.9c6.9,6.6,8.6,15.9,5,27.8-2.6,8.6-6.7,15.7-12.2,21.2-5.6,5.5-12.5,9.8-20.8,12.9-8.3,3.1-17.9,4.6-28.9,4.6s-20-1.3-26.5-4c-6.5-2.7-11.2-6.9-14-12.6-2.8-5.7-2.9-12.9-.3-21.6ZM3747.3,641.7h75.7l-4.8,15.9h-45l-3.9,12.9h38.5l-4.5,15h-38.5l-9.1,30.2h-30.7l22.3-73.9ZM3661.6,671.7h12.9c1.4,0,4.2-.3,8.4-1,2.1-.3,4-1.1,5.7-2.3,1.7-1.3,2.7-2.7,3.2-4.3.7-2.4.3-4.2-1.4-5.5-1.6-1.3-5.3-1.9-10.9-1.9h-13.5l-4.5,15.1ZM3617.6,715.6l22.3-73.9h51c9.5,0,16.5.6,21.1,1.8,4.6,1.2,8,3.5,10.1,6.7,2.1,3.3,2.4,7.3,1,12-1.2,4.1-3.5,7.6-6.7,10.6-3.2,3-7.2,5.4-11.9,7.3-3,1.2-6.9,2.2-11.6,2.9,3.4.9,5.8,1.8,7.1,2.7.9.6,2.2,1.9,3.7,3.9,1.5,2,2.5,3.5,2.9,4.6l8.4,21.4h-34.6l-9.6-22.5c-1.2-2.9-2.5-4.8-3.8-5.7-1.9-1.1-4.2-1.7-7-1.7h-2.7l-9,29.9h-30.7ZM3539.6,641.7h81.9l-4.8,15.8h-51.2l-3.5,11.8h47.5l-4.5,15.1h-47.5l-4.4,14.6h52.7l-5,16.7h-83.4l22.3-73.9ZM3460.7,673.3h7.5c5.9,0,10.4-.8,13.2-2.3,2.9-1.5,4.7-3.5,5.4-5.9.7-2.3.3-4.3-1.4-5.9-1.6-1.6-5.3-2.4-11-2.4h-8.8l-5,16.5ZM3439.5,641.7h50.9c11.1,0,18.8,2,23.2,5.9,4.3,3.9,5.4,9.6,3.2,16.8-2.3,7.5-7,13.3-14.3,17.5-7.3,4.2-17.1,6.3-29.5,6.3h-16.8l-8.2,27.4h-30.7l22.3-73.9Z"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: fillDelay + 0.2, duration: fillDuration, ease: "easeOut" }}
        />

        {/* R circle logo */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: fillDelay + 0.3, duration: 0.3, ease: "easeOut" }}
        >
          <path fill="#00388a" d="M4720.5,298.3c-2.8-3.7-5-6.3-6.6-7.7-1.6-1.4-3.7-2.8-6.2-4,5-.6,8.8-2.1,11.4-4.4,2.5-2.3,3.8-5.3,3.8-8.8s-.8-5.3-2.5-7.5c-1.7-2.2-3.9-3.7-6.7-4.5-2.8-.9-7.2-1.3-13.4-1.3h-24.4v47.5h11.6v-19.8h2.3c2.7,0,4.6.2,5.8.5,1.2.4,2.4,1,3.5,2,1.1,1,3.1,3.3,6.1,7l8.4,10.3h13.9l-7-9.3ZM4696.1,280.1h-8.6v-12h9c4.7,0,7.5,0,8.5.2,1.9.3,3.3.9,4.4,1.9,1,1,1.5,2.3,1.5,3.9s-.4,2.6-1.2,3.6c-.8,1-1.9,1.6-3.2,2-1.4.4-4.9.6-10.4.6Z"/>
          <path fill="#00388a" d="M4699.8,238.6c-25.7,0-46.6,20.9-46.6,46.6s20.9,46.6,46.6,46.6,46.6-20.9,46.6-46.6-20.9-46.6-46.6-46.6ZM4699.8,323.5c-21.2,0-38.4-17.2-38.4-38.4s17.2-38.4,38.4-38.4,38.4,17.2,38.4,38.4-17.2,38.4-38.4,38.4Z"/>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
