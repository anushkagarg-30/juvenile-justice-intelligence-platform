"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Briefcase,
  FileText,
  Globe,
  Scale,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ICONS: Record<string, LucideIcon> = {
  Search,
  Globe,
  Scale,
  FileText,
  Brain,
  Briefcase,
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  index: number;
}

export function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  const Icon = ICONS[icon] ?? Search;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Card className="h-full transition-shadow hover:shadow-[0_0_32px_rgba(59,130,246,0.15)]">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-violet-600/30">
            <Icon className="h-5 w-5 text-blue-300" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </motion.div>
  );
}
