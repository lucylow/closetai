import { motion } from "framer-motion";
import { Shirt, Camera, TrendingUp, PenTool } from "lucide-react";

const features = [
  { icon: Shirt, title: "AI Outfit Suggestions", desc: "Personalized combinations based on occasion, weather, and current trends." },
  { icon: Camera, title: "Virtual Try‑On", desc: "See how clothes look on you without moving a muscle – powered by Perfect Corp." },
  { icon: TrendingUp, title: "Trend Research", desc: "Real‑time fashion insights from You.com, with citations and sources." },
  { icon: PenTool, title: "Content Generator", desc: "Create Instagram‑ready posts & captions from your outfits in one click." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="container py-20">
      <h2 className="text-center text-3xl md:text-4xl font-bold font-display mb-4">More than a digital closet</h2>
      <p className="text-center text-muted-foreground text-lg max-w-xl mx-auto mb-14">
        ClosetAI uses state‑of‑the‑art AI to transform how you interact with your wardrobe.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-card p-7 text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-primary mx-auto">
              <f.icon size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold font-display">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
