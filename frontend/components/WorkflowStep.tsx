"use client";

import { motion } from "framer-motion";

interface WorkflowStepProps {
  step: number;
  title: string;
  description: string;
  index: number;
}

export function WorkflowStep({ step, title, description, index }: WorkflowStepProps) {
  return (
    <motion.div
      className="relative flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/40 bg-blue-600/20 text-sm font-bold text-blue-200">
          {step}
        </div>
        {index < 3 && <div className="mt-2 h-full w-px bg-gradient-to-b from-blue-500/40 to-transparent" />}
      </div>
      <div className="pb-8">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
