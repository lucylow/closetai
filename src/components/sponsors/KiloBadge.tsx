import React, { useEffect, useState } from "react";
import { Code2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import "./KiloBadge.css";

interface KiloStats {
  prompts: number;
  linesOfCode: number;
  commits: number;
  timeSaved: string;
}

const FALLBACK_STATS: KiloStats = {
  prompts: 47,
  linesOfCode: 15200,
  commits: 34,
  timeSaved: "12 hours",
};

const KiloBadge: React.FC = () => {
  const [stats, setStats] = useState<KiloStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<KiloStats>("/kilo/stats", false);
        setStats(data);
      } catch {
        setStats(FALLBACK_STATS);
      }
    };
    fetchStats();
  }, []);

  const displayStats = stats ?? FALLBACK_STATS;

  return (
    <div className="kilo-badge">
      <div className="kilo-header">
        <div className="kilo-logo">
          <Code2 size={24} />
        </div>
        <span className="kilo-title">Built with Kilo Code</span>
      </div>
      <div className="kilo-stats">
        <div className="stat">
          <span className="stat-value">{displayStats.prompts}</span>
          <span className="stat-label">AI prompts</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {displayStats.linesOfCode.toLocaleString()}
          </span>
          <span className="stat-label">lines of code</span>
        </div>
        <div className="stat">
          <span className="stat-value">{displayStats.commits}</span>
          <span className="stat-label">commits</span>
        </div>
        <div className="stat">
          <span className="stat-value">{displayStats.timeSaved}</span>
          <span className="stat-label">time saved</span>
        </div>
      </div>
      <p className="kilo-footer">
        Powered by{" "}
        <a
          href="https://kilo.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="kilo-link"
        >
          Kilo.ai
          <ExternalLink size={12} className="inline ml-1" />
        </a>
        – Finally Ship It.
      </p>
    </div>
  );
};

export default KiloBadge;
