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
        ClosetAI is built on a foundation of peer‑reviewed research and industry
        data.
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
        <p>
          By addressing the root causes of fashion waste and decision fatigue,
          ClosetAI doesn't just help you look good – it helps you feel good and
          shop smarter.
        </p>
      </div>
    </div>
  );
};

export default ImpactDashboard;
