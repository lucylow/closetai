import type { DailyOutfit } from "@/hooks/useRecommendation";

interface OutfitCardProps {
  outfit: DailyOutfit;
  children?: React.ReactNode;
}

const OutfitCard = ({ outfit, children }: OutfitCardProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-2 justify-center flex-wrap mb-3">
        {outfit.items.map((item) => (
          <div
            key={item.id}
            className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                👕
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{outfit.description}</p>
        {children}
      </div>
    </div>
  );
};

export default OutfitCard;
