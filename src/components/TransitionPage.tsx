import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

interface Props {
  children: ReactNode;
  className?: string;
}

export function TransitionPage({ children, className }: Props) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={className}
    >
      {children}
    </motion.div>
  );
}
