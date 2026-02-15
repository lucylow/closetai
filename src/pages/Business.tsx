import { motion } from "framer-motion";
import {
  LineChart,
  Rocket,
  DollarSign,
  Shield,
  Users,
  Smartphone,
  Star,
  Gem,
  ExternalLink,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const competitors = [
  {
    name: "Alta",
    concept:
      "Personal AI stylist (upload closet → outfit generation → agentic shopping)",
    funding: "$11M Seed",
    investors: "Menlo Ventures, Aglaé Ventures (LVMH)",
  },
  {
    name: "Glance AI",
    concept: "GenAI personalization for apparel (two-sided platform)",
    funding: "Part of Glance (300M+ devices)",
    investors: "Massive scale entrant",
  },
  {
    name: "BNTO",
    concept: "AI-powered fashion rental + styling assistant",
    funding: "$15M Series A",
    investors: "Enterprise value $60-90M",
  },
  {
    name: "Stylitics",
    concept: "B2B AI styling solutions for fashion businesses",
    funding: "$99.3M total",
    investors: "Enterprise SaaS",
  },
  {
    name: "Prévoir",
    concept: "AI computer vision for trend forecasting",
    funding: "$750K pre-seed",
    investors: "Jan 2026",
  },
];

const revenueStreams = [
  {
    icon: DollarSign,
    title: "E-commerce / Affiliate",
    desc: "Disrupt $20B affiliate marketing & $160B U.S. online apparel market. Partnerships with thousands of brands.",
  },
  {
    icon: Users,
    title: "Two-sided Platform",
    desc: "Connect consumers with brands; revenue sharing & targeted promotions.",
  },
  {
    icon: Star,
    title: "Premium Subscriptions",
    desc: "Freemium model: unlimited AI outfits, deeper trend analytics, high-res try-on.",
  },
  {
    icon: Gem,
    title: "Data Insights (SaaS)",
    desc: "Aggregated fashion trends & wardrobe data sold to retailers for forecasting.",
  },
];

const advantages = [
  {
    icon: Smartphone,
    title: "Superior UX",
    desc: "Frictionless personalization, seamless checkout – the key differentiator cited by Counterpoint Research.",
  },
  {
    icon: LineChart,
    title: "Sophisticated AI",
    desc: "Over a dozen specialized models, stylist-in-the-loop RL to handle 250+ shades of red and complex styling logic.",
  },
  {
    icon: Rocket,
    title: "Hybrid / On-Device AI",
    desc: "Cut computational costs by running models locally – a critical scale advantage identified in the Glance AI analysis.",
  },
  {
    icon: Shield,
    title: "Trust & Personalization Loop",
    desc: "The more you use it, the better it gets – creating a data moat and high switching costs.",
  },
];

const risks = [
  {
    risk: "Intense Competition",
    mitigation:
      "Focus on niche differentiator (sustainability, specific demographic) and build loyal community before expanding.",
  },
  {
    risk: "High Computational Costs",
    mitigation:
      "Architect for efficiency: on-device model execution (Core ML / TensorFlow Lite) for key tasks.",
  },
  {
    risk: "User Acquisition Cost",
    mitigation:
      "Leverage social styling features & micro-influencer partnerships for viral growth.",
  },
  {
    risk: '"Winner-Take-All" Dynamics',
    mitigation:
      "Market is still fragmented; multiple players can coexist by serving different niches/geographies.",
  },
];

const Business = () => {
  return (
    <div className="page business max-w-5xl mx-auto space-y-12 pb-16">
      {/* Hero */}
      <motion.div
        className="text-center space-y-4"
        {...fadeInUp}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display logo-gradient">
          ClosetAI: The Investment Thesis
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          A venture-backed vision validated by market data and recent funding.
        </p>
      </motion.div>

      {/* Executive Summary */}
      <motion.div
        className="glass-card p-6 sm:p-8 space-y-4"
        {...fadeInUp}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold font-display">Executive Summary</h2>
        <p className="text-muted-foreground leading-relaxed">
          The global styling app market is projected to reach{" "}
          <strong className="text-foreground">$3.5 billion by 2033</strong>{" "}
          (CAGR 12.5%), driven by AI personalization, AR visualization, and
          consumer demand for sustainable fashion.
        </p>
        <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-5 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            🚀 Market Validation
          </span>
          <p className="text-muted-foreground leading-relaxed">
            In mid-2025, top-tier VC{" "}
            <strong className="text-foreground">Menlo Ventures led an $11M seed round for Alta</strong>{" "}
            – a startup with a concept nearly identical to ClosetAI. This is
            real-world proof that the idea is not only feasible but highly
            investable.
          </p>
        </div>
        <div className="rounded-2xl border-l-4 border-emerald-500/80 bg-emerald-500/5 p-5 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            📊 Evidence-Based Impact
          </span>
          <p className="text-muted-foreground leading-relaxed">
            Peer-reviewed research validates our impact thesis: addressing fit, occasion, and style could mitigate{" "}
            <strong className="text-foreground">80% of low usage issues</strong> in clothing (Torrens University 2025). AI personalization reduces return rates by{" "}
            <strong className="text-foreground">10–20%</strong> and lifts conversion by{" "}
            <strong className="text-foreground">20–40%</strong> (RSM/Accenture 2025). ClosetAI directly addresses these documented problems.
          </p>
        </div>
      </motion.div>

      {/* Market Size */}
      <motion.div
        className="space-y-6"
        {...fadeInUp}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold font-display">
          Massive & Growing Market
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-6 sm:p-8 text-center">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">
              $3.5B
            </span>
            <span className="text-sm text-muted-foreground">TAM by 2033</span>
          </div>
          <div className="glass-card p-6 sm:p-8 text-center">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">
              12.5%
            </span>
            <span className="text-sm text-muted-foreground">CAGR</span>
          </div>
          <div className="glass-card p-6 sm:p-8 text-center">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">
              3
            </span>
            <span className="text-sm text-muted-foreground">
              High-Growth Segments
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            "Virtual Styling (AI outfits, try-on)",
            "Wardrobe Management (digital closet)",
            "E-commerce Integration (in-app purchases)",
          ].map((seg, i) => (
            <span
              key={i}
              className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary"
            >
              {seg}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Competitor Table */}
      <motion.div
        className="space-y-4"
        {...fadeInUp}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold font-display">
          Comparable Success: Startups Are Raising Significant Funding
        </h2>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Company
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Concept
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Funding
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Investors / Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold">{comp.name}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {comp.concept}
                    </td>
                    <td className="py-4 px-4 text-sm">{comp.funding}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {comp.investors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-sm italic text-muted-foreground">
          Alta's $11M seed round is the strongest validation: top VCs believe in
          a "personal AI stylist".
        </p>
      </motion.div>

      {/* Revenue Models */}
      <motion.div
        className="space-y-6"
        {...fadeInUp}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold font-display">
          Multiple Paths to Revenue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueStreams.map((item, idx) => (
            <div
              key={idx}
              className="glass-card p-6 text-center space-y-3 h-full flex flex-col"
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon size={24} className="text-primary" />
                </div>
              </div>
              <h3 className="font-semibold font-display text-base">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strategic Advantages */}
      <motion.div
        className="space-y-6"
        {...fadeInUp}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold font-display">
          ClosetAI's Competitive Moat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {advantages.map((adv, idx) => (
            <div
              key={idx}
              className="glass-card p-6 space-y-3 h-full flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <adv.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold font-display">{adv.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {adv.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk Mitigation */}
      <motion.div
        className="space-y-6"
        {...fadeInUp}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-xl font-semibold font-display">Risk Mitigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((item, idx) => (
            <div
              key={idx}
              className="glass-card p-5 border-l-4 border-amber-500/80 space-y-2"
            >
              <div className="font-bold text-amber-600 dark:text-amber-400">
                {item.risk}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {item.mitigation}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="text-center py-12 px-6 rounded-3xl bg-gradient-to-b from-muted/50 to-background border border-border"
        {...fadeInUp}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">
          ClosetAI is not just a hackathon project.
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          It is a venture-backed thesis waiting to be executed. Join us on the
          journey.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
        >
          View Pitch Deck
          <ExternalLink size={18} />
        </a>
      </motion.div>

      {/* Sponsor Footer */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Powered by Perfect Corp · You.com · Kilo · Akamai
        </p>
      </div>
    </div>
  );
};

export default Business;
