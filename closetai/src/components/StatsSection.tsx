import { motion } from "framer-motion";

const stats = [
  { number: "20-40%", desc: "of wardrobe worn regularly – we help you use the rest." },
  { number: "18 min", desc: "saved daily on outfit decisions (Barclays/UCL study)." },
  { number: "52%", desc: "of unworn clothes are for specific occasions – we remix them." },
];

const StatsSection = () => {
  return (
    <section className="container pb-20">
      <div className="flex flex-wrap justify-center gap-7">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="flex-1 min-w-[200px] max-w-[320px] bg-card rounded-3xl p-7 text-center shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-4xl font-bold font-display text-primary mb-2">{s.number}</div>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
