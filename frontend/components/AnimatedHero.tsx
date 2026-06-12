"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnimatedHero() {
  return (
    <section className="relative px-6 pb-24 pt-16 md:px-12 md:pt-24">
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-blue-200">
            <Sparkles className="h-4 w-4" />
            AI-Powered Legal Intelligence
          </span>
        </motion.div>

        <motion.h1
          className="font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="text-gradient">AI-Powered Juvenile Justice</span>
          <br />
          <span className="text-foreground">Case Intelligence</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Compare juvenile case facts across jurisdictions, retrieve the most relevant precedents,
          and generate citation-backed legal research reports in minutes.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Button asChild variant="glow" size="lg" className="group min-w-[200px]">
            <Link href="/dashboard">
              Analyze Case
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[200px]">
            <Link href="/report?demo=true">View Demo Report</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
