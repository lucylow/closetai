import { motion } from "framer-motion";

const steps = [
  { num: 1, title: "Upload clothes", desc: "Snap photos or drag & drop. AI identifies each item." },
  { num: 2, title: "AI builds your profile", desc: "Color, style, pattern – we learn your taste." },
  { num: 3, title: "Get daily outfits", desc: "Personalized suggestions with weather & trend awareness." },
  { num: 4, title: "Share & shop", desc: "Post looks instantly or fill wardrobe gaps." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="container py-20">
      <h2 className="text-center text-3xl md:text-4xl font-bold font-display mb-10">How ClosetAI works</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            className="flex-1 min-w-[180px] max-w-[240px] text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-display mx-auto text-lg">
              {s.num}
            </div>
            <h4 className="font-semibold font-display">{s.title}</h4>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
