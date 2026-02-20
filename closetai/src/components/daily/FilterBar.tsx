import { Button } from "@/components/ui/button";

const FILTERS = ["all", "casual", "formal", "party", "work"] as const;
export type FilterType = (typeof FILTERS)[number];

interface FilterBarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FilterBar = ({ currentFilter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Button
          key={f}
          variant={f === currentFilter ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => onFilterChange(f)}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </Button>
      ))}
    </div>
  );
};

export default FilterBar;
