"use client";

import { motion } from "framer-motion";

interface MetricCardProps {
  value: string;
  label: string;
  index: number;
}

export function MetricCard({ value, label, index }: MetricCardProps) {
  return (
    <motion.div
      className="glass glow-border rounded-xl p-6 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="font-serif text-3xl font-bold text-gradient md:text-4xl">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
