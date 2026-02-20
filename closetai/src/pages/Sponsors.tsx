import { PerfectCorpTryOn, KiloBadge, AkamaiDeployment, YouComTrends } from "@/components/sponsors";
import type { SelectedGarment } from "@/components/sponsors";
import { useWardrobe } from "@/hooks/useWardrobe";
import { DEMO_WARDROBE } from "@/lib/data";
import { demoAPIStats } from "@/mocks/youcam";
import { Sparkles, Search, Server, Code2, Zap } from "lucide-react";

const Sponsors = () => {
  const { items: apiItems, isAuthenticated } = useWardrobe();
  const wardrobeItems = isAuthenticated ? apiItems : DEMO_WARDROBE;
  const availableGarments: SelectedGarment[] = wardrobeItems.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl || (item as { image?: string }).image || "",
    category: item.category || "top",
    color: item.color,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">
          Sponsor Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Powered by Perfect Corp, Kilo Code, Akamai, and You.com
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center space-y-1">
          <Sparkles size={24} className="mx-auto text-primary" />
          <div className="text-xl font-bold">{demoAPIStats.totalAPICallsToday}</div>
          <div className="text-xs text-muted-foreground">API Calls Today</div>
        </div>
        <div className="glass-card p-4 text-center space-y-1">
          <Search size={24} className="mx-auto text-primary" />
          <div className="text-xl font-bold">{demoAPIStats.successRate}%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
        <div className="glass-card p-4 text-center space-y-1">
          <Zap size={24} className="mx-auto text-primary" />
          <div className="text-xl font-bold">{demoAPIStats.avgResponseTime}</div>
          <div className="text-xs text-muted-foreground">Avg Response</div>
        </div>
        <div className="glass-card p-4 text-center space-y-1">
          <Server size={24} className="mx-auto text-primary" />
          <div className="text-xl font-bold">{demoAPIStats.creditsRemaining.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Credits Left</div>
        </div>
      </div>

      <section>
        <PerfectCorpTryOn availableGarments={availableGarments} />
      </section>

      <section>
        <YouComTrends />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <KiloBadge />
        <AkamaiDeployment />
      </div>
    </div>
  );
};

export default Sponsors;
