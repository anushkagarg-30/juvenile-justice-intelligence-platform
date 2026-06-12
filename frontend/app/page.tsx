import Link from "next/link";
import { Scale } from "lucide-react";
import { AnimatedHero } from "@/components/AnimatedHero";
import { FeatureCard } from "@/components/FeatureCard";
import { Footer } from "@/components/Footer";
import { JusticeScaleBackdrop } from "@/components/JusticeScaleBackdrop";
import { MetricCard } from "@/components/MetricCard";
import { WorkflowStep } from "@/components/WorkflowStep";
import { Button } from "@/components/ui/button";
import { FEATURES, METRICS, WORKFLOW_STEPS } from "@/lib/mock-data";

const ABOUT_BLOCKS = [
  {
    title: "The Challenge",
    body: "Juvenile justice research is fragmented across jurisdictions, buried in unstructured case narratives, and slow to compare. Counsel and researchers spend hours manually searching for analogous dispositions, applicable statutes, and constitutional limits — often with incomplete results.",
  },
  {
    title: "Our Approach",
    body: "JJIP uses semantic vector search to match case facts against thousands of indexed juvenile precedents, statutes, and constitutional protections. A retrieval-augmented pipeline then synthesizes findings into structured, citation-backed research reports — in minutes, not days.",
  },
  {
    title: "Who It's For",
    body: "Built for defense attorneys preparing disposition arguments, legal aid researchers comparing cross-border outcomes, policy analysts studying juvenile justice trends, and academic teams exploring AI-assisted legal research workflows.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative z-10 min-h-screen overflow-hidden">
      <JusticeScaleBackdrop />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="font-serif text-lg font-semibold">JJIP</span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </header>

      <AnimatedHero />

      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            Intelligent Research for Juvenile Justice
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            The Juvenile Justice Intelligence Platform combines modern AI with rigorous legal
            retrieval to help practitioners find the most relevant precedents, understand
            applicable law, and generate professional research memos — grounded in real case
            data, not generic chatbot output.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
          {ABOUT_BLOCKS.map((block) => (
            <div key={block.title} className="glass glow-border rounded-xl p-6">
              <h3 className="font-serif text-xl font-semibold text-blue-200">{block.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center font-serif text-3xl font-bold md:text-4xl">
            Built for Legal Intelligence
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
            Every feature is designed around how legal researchers actually work — from structured
            case intake to exportable research deliverables.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold">How It Works</h2>
            <p className="mt-3 text-muted-foreground">
              From structured case intake to a citation-backed research report in four steps.
              Each stage uses vector embeddings to surface the most factually analogous material
              from our indexed legal corpus.
            </p>
            <div className="mt-8">
              {WORKFLOW_STEPS.map((step, i) => (
                <WorkflowStep key={step.step} {...step} index={i} />
              ))}
            </div>
          </div>
          <div className="glass glow-border rounded-2xl p-8">
            <h3 className="font-serif text-2xl font-bold">Technology Stack</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              A production-ready architecture combining modern AI infrastructure with
              battle-tested legal data storage.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-blue-400">→</span>
                FastAPI backend with pgvector semantic search on Supabase PostgreSQL
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">→</span>
                Gemini embeddings (768-dim) for meaning-based case and law retrieval
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">→</span>
                RAG-powered report generation with structured legal sections and citations
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">→</span>
                Multi-jurisdiction coverage: United States, India, United Kingdom
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">→</span>
                Export-ready PDF research reports for court filings and client memos
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center font-serif text-3xl font-bold">Impact</h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
            Designed to dramatically reduce research time while improving the breadth and
            consistency of legal analysis across juvenile cases.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((metric, i) => (
              <MetricCard key={metric.label} {...metric} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-20 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Ready to analyze a case?</h2>
          <p className="mt-4 text-muted-foreground">
            Enter juvenile case facts and receive ranked precedents, applicable law, and a
            downloadable research report in minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild variant="glow" size="lg">
              <Link href="/dashboard">Start Case Analysis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/report?demo=true">View Demo Report</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
