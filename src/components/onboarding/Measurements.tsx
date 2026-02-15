import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeasurementsData {
  height?: string;
  weight?: string;
  bust?: string;
  waist?: string;
  hips?: string;
}

interface MeasurementsProps {
  onNext: (measurements: MeasurementsData | null) => void;
  onBack: () => void;
  initialData?: Record<string, unknown>;
}

const Measurements = ({ onNext, onBack, initialData }: MeasurementsProps) => {
  const [measurements, setMeasurements] = useState<MeasurementsData>(
    (initialData?.measurements as MeasurementsData) || {
      height: "",
      weight: "",
      bust: "",
      waist: "",
      hips: "",
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onNext(measurements);
  };

  const handleSkip = () => {
    onNext(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold font-display">Body measurements (optional)</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Helps with virtual try-on accuracy. You can skip.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Height (cm)</Label>
          <Input
            type="number"
            name="height"
            value={measurements.height}
            onChange={handleChange}
            placeholder="e.g. 170"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            name="weight"
            value={measurements.weight}
            onChange={handleChange}
            placeholder="e.g. 65"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Bust (cm)</Label>
          <Input
            type="number"
            name="bust"
            value={measurements.bust}
            onChange={handleChange}
            placeholder="Optional"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Waist (cm)</Label>
          <Input
            type="number"
            name="waist"
            value={measurements.waist}
            onChange={handleChange}
            placeholder="Optional"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Hips (cm)</Label>
          <Input
            type="number"
            name="hips"
            value={measurements.hips}
            onChange={handleChange}
            placeholder="Optional"
            className="rounded-xl mt-1"
          />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip} className="rounded-full">
            Skip
          </Button>
          <Button onClick={handleSubmit} className="rounded-full">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Measurements;
