"use client";
import { motion } from "framer-motion";

const PX = Array.from({ length: 200 }, (_, id) => ({
  id,
  delay: Math.random() * 0.65,
  dur:   1.1 + Math.random() * 1.4,
  op:    0.3 + Math.random() * 0.7,
  l:     50 + Math.floor(Math.random() * 28),
}));

export function Loader({ cols = 60 }: { cols?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: "repeat(2, 1fr)",
      gap: 2, width: "100%",
    }}>
      {PX.slice(0, cols * 2).map(p => (
        <motion.span
          key={p.id}
          style={{ display: "block", aspectRatio: "1", borderRadius: "50%", background: `hsl(213 85% ${p.l}%)` }}
          initial={{ opacity: p.op * 0.12 }}
          animate={{ opacity: [p.op * 0.12, p.op, 0, p.op * 0.8] }}
          transition={{ delay: p.delay, duration: p.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
