import { PerfectCorpTryOn, KiloBadge, AkamaiDeployment, YouComTrends } from "@/components/sponsors";
import type { SelectedGarment } from "@/components/sponsors";
import { useWardrobe } from "@/hooks/useWardrobe";
import { DEMO_WARDROBE } from "@/lib/data";

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

      {/* 1. Perfect Corp - Virtual Try-On */}
      <section>
        <PerfectCorpTryOn availableGarments={availableGarments} />
      </section>

      {/* 2. You.com - Trend Research */}
      <section>
        <YouComTrends />
      </section>

      {/* 3 & 4. Kilo Badge & Akamai - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <KiloBadge />
        <AkamaiDeployment />
      </div>
    </div>
  );
};

export default Sponsors;
