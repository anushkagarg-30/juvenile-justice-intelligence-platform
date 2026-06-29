"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Database,
  FileText,
  Scale,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "New Case Analysis", icon: Search },
  { href: "/reports", label: "Reports", icon: FileText, match: ["/reports", "/report"] },
  { href: "/cases", label: "Case Database", icon: Database },
  { href: "/laws", label: "Laws Database", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, match?: string[]) {
  const paths = match ?? [href];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-strong relative z-20 flex h-full w-64 shrink-0 flex-col border-r border-white/10">
      <div className="border-b border-white/10 p-6">
        <Link href="/" className="flex items-center gap-3" aria-label="JJIP home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">JJIP</p>
            <p className="text-[10px] text-muted-foreground">Legal Intelligence</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.match);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-blue-600/20 text-blue-200"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          AI-assisted research support only. Not legal advice.
        </p>
      </div>
    </aside>
  );
}
