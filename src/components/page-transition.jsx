import { motion } from 'framer-motion';

// Shared "smart animate"-style crossfade for every route change in the app
// (Login ↔ Today's Patient ↔ New Registration): a soft fade combined with a
// small vertical drift, so navigating between screens interpolates smoothly
// instead of hard-cutting — the same feeling as a Figma prototype transition
// set to Smart Animate.
const VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const TRANSITION = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TRANSITION}
    >
      {children}
    </motion.div>
  );
}
