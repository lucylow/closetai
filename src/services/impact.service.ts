// Simulates fetching research-backed impact statistics

export interface ImpactStat {
  id: number;
  title: string;
  stat: string;
  description: string;
  insight: string;
  source: string;
  sourceUrl: string;
  icon: string;
  color: string;
}

export const getImpactStats = (): ImpactStat[] => {
  return [
    {
      id: 1,
      title: "Clothing utilisation decline",
      stat: "33%",
      description:
        "Clothing utilisation has dropped by over a third in the last 15 years.",
      insight:
        "People own more clothes but wear them less – creating hidden wardrobe waste.",
      source: "PLATE2025 Conference",
      sourceUrl: "#",
      icon: "📉",
      color: "#e53e3e",
    },
    {
      id: 2,
      title: "The 80% solution",
      stat: "80%",
      description:
        "Addressing fit, occasion, and style could mitigate up to 80% of low usage issues.",
      insight:
        "ClosetAI helps you find the right fit, occasion‑appropriate combinations, and style‑aligned outfits from your existing wardrobe.",
      source: "Torrens University (2025)",
      sourceUrl: "#",
      icon: "✨",
      color: "#6e4ae0",
    },
    {
      id: 3,
      title: "Sustainable use drivers",
      stat: "80%",
      description:
        "Personal factors (trend sensitivity, style orientation, frugality) explain 80% of variance in sustainable clothing use.",
      insight:
        "By keeping you fashion‑forward with your own clothes, ClosetAI activates these psychological drivers.",
      source: "Cleaner and Responsible Consumption (2024)",
      sourceUrl: "#",
      icon: "🌱",
      color: "#38a169",
    },
    {
      id: 4,
      title: "Cart abandonment",
      stat: "70%",
      description:
        "At least 70% of online fashion shoppers abandon their cart each session.",
      insight:
        "The main reason? Inability to visualize how items fit their personal style or existing wardrobe.",
      source: "Capital One Shopping Research (2025)",
      sourceUrl: "#",
      icon: "🛒",
      color: "#d69e2e",
    },
    {
      id: 5,
      title: "Return reduction",
      stat: "10-20%",
      description:
        "AI‑powered personalization can reduce return rates by 10‑20%.",
      insight:
        "ClosetAI's virtual try‑on and smart recommendations help you choose right the first time.",
      source: "RSM / Accenture (2025)",
      sourceUrl: "#",
      icon: "🔄",
      color: "#00c9b7",
    },
    {
      id: 6,
      title: "Decision fatigue mitigation",
      stat: "✓",
      description:
        "AI‑driven recommendations significantly reduce cognitive load and purchase postponement.",
      insight:
        "Instead of overwhelming options, you get personalized, context‑aware suggestions.",
      source: "Journal of Retailing and Consumer Services (2025)",
      sourceUrl: "#",
      icon: "🧠",
      color: "#9f7ef5",
    },
  ];
};
