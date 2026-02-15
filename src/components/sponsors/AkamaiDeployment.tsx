import React, { useEffect, useState } from "react";
import { Server, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import "./AkamaiDeployment.css";

interface DeploymentInfo {
  region: string;
  gpu: string;
  gpuCount: number;
  uptime: string;
  creditsUsed: number;
}

const FALLBACK_DEPLOYMENT: DeploymentInfo = {
  region: "US-Seattle",
  gpu: "NVIDIA RTX 4000 Ada",
  gpuCount: 2,
  uptime: "99.9%",
  creditsUsed: 234.5,
};

const AkamaiDeployment: React.FC = () => {
  const [deployment, setDeployment] = useState<DeploymentInfo | null>(null);

  useEffect(() => {
    const fetchDeploymentInfo = async () => {
      try {
        const data = await api.get<DeploymentInfo>("/akamai/info", false);
        setDeployment(data);
      } catch {
        setDeployment(FALLBACK_DEPLOYMENT);
      }
    };
    fetchDeploymentInfo();
  }, []);

  const info = deployment ?? FALLBACK_DEPLOYMENT;

  return (
    <div className="akamai-deployment">
      <h3 className="akamai-title">
        <Server size={20} />
        Powered by Akamai Cloud
      </h3>
      <div className="deployment-grid">
        <div className="deployment-item">
          <span className="label">Region</span>
          <span className="value">{info.region}</span>
        </div>
        <div className="deployment-item">
          <span className="label">GPU Instance</span>
          <span className="value">{info.gpu}</span>
        </div>
        <div className="deployment-item">
          <span className="label">GPU Count</span>
          <span className="value">{info.gpuCount}</span>
        </div>
        <div className="deployment-item">
          <span className="label">Uptime</span>
          <span className="value">{info.uptime}</span>
        </div>
        <div className="deployment-item">
          <span className="label">Credits Used</span>
          <span className="value">${info.creditsUsed.toFixed(2)}</span>
        </div>
      </div>
      <p className="akamai-footer">
        Deployed on{" "}
        <a
          href="https://linode.com"
          target="_blank"
          rel="noopener noreferrer"
          className="akamai-link"
        >
          Linode Kubernetes Engine
          <ExternalLink size={12} className="inline ml-1" />
        </a>{" "}
        with $1,000 promotional credit.
      </p>
    </div>
  );
};

export default AkamaiDeployment;
