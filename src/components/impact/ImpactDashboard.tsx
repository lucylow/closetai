import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getImpactStats } from "@/services/impact.service";
import type { ImpactStat } from "@/services/impact.service";
import "./ImpactDashboard.css";

const ImpactDashboard = () => {
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [selectedStat, setSelectedStat] = useState<number | null>(null);

  useEffect(() => {
    setStats(getImpactStats());
  }, []);

  return (
    <div className="impact-dashboard">
      <h2 className="impact-section-title">Real‑World Impact</h2>
      <p className="impact-section-subtitle">
        ClosetAI is grounded in peer‑reviewed research and industry data. The
        problems we solve—wardrobe underutilisation and decision fatigue—are
        documented, measurable, and addressable.
      </p>

      <div className="impact-stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className={`impact-stat-card glass-card ${
              selectedStat === stat.id ? "expanded" : ""
            }`}
            onClick={() =>
              setSelectedStat(selectedStat === stat.id ? null : stat.id)
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="impact-stat-icon"
              style={{
                backgroundColor: stat.color + "20",
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>
            <div className="impact-stat-content">
              <h3>{stat.title}</h3>
              <div className="impact-stat-number">{stat.stat}</div>
              <p className="impact-stat-description">{stat.description}</p>

              {selectedStat === stat.id && (
                <motion.div
                  className="impact-stat-insight"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{stat.insight}</p>
                  <a
                    href={stat.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="impact-source-link"
                  >
                    Source: {stat.source}
                  </a>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="impact-conclusion">
        <h3 className="impact-conclusion-heading">How ClosetAI delivers</h3>
        <p>
          <strong>Problem:</strong> People own more clothes but wear them less
          (33% utilisation decline). They face overwhelming choices (70% cart
          abandonment) and experience decision fatigue that degrades judgment.
        </p>
        <p>
          <strong>Solution:</strong> ClosetAI digitizes your wardrobe, extracts
          fit and style, and combines occasion, weather, and trend data to
          suggest outfits you'll actually wear. Virtual try‑on lets you
          visualize before committing. Trend research keeps you fashion‑forward
          without buying new.
        </p>
        <p>
          <strong>Impact:</strong> Users wear more of what they own (addressing
          up to 80% of low usage issues), make faster confident decisions
          (reducing fatigue), and stay stylish sustainably. This isn't just a
          clever demo—it's a solution to documented, measurable problems.
        </p>
      </div>
    </div>
  );
};

export default ImpactDashboard;
