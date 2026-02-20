// Research-backed impact statistics for ClosetAI hackathon submission
// Sources: PLATE2025, Torrens University, Cleaner & Responsible Consumption,
// Capital One, RSM/Accenture, Journal of Retailing and Consumer Services, IEEE

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
        "Clothing utilisation has dropped by over a third in the last 15 years; dresses are the least worn of any significant clothing item.",
      insight:
        "People own more clothes but wear them less – creating hidden wardrobe waste. The use phase is carbon-intensive and squarely within the user's control.",
      source: "Kuzmycz & McCorkill, PLATE2025",
      sourceUrl: "https://journals.aau.dk/index.php/plate2025",
      icon: "📉",
      color: "#e53e3e",
    },
    {
      id: 2,
      title: "The 80% solution",
      stat: "80%",
      description:
        "Addressing fit, occasion, and style could mitigate up to 80% of low usage issues in clothing.",
      insight:
        "ClosetAI helps you find the right fit, occasion‑appropriate combinations, and style‑aligned outfits from your existing wardrobe – the three factors that determine whether clothes get worn.",
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
        "Personal factors (trend sensitivity, style orientation, frugality) explain 80% of variance in sustainable clothing use practices.",
      insight:
        "By keeping you fashion‑forward with your own clothes via trend research and style learning, ClosetAI activates the psychological drivers of sustainable behavior.",
      source: "Joyner Martinez et al., Cleaner & Responsible Consumption (2024)",
      sourceUrl: "#",
      icon: "🌱",
      color: "#38a169",
    },
    {
      id: 4,
      title: "Cart abandonment",
      stat: "70%",
      description:
        "At least 70% of online fashion customers abandon their cart each session due to overwhelm.",
      insight:
        "The #1 reason: inability to visualize how items fit their personal style or existing closet. ClosetAI's virtual try‑on solves this.",
      source: "Capital One Shopping Research (2025)",
      sourceUrl: "#",
      icon: "🛒",
      color: "#d69e2e",
    },
    {
      id: 5,
      title: "Return rates & AI impact",
      stat: "25% → 10–20%",
      description:
        "One in four fashion items is returned; AI‑powered personalization can reduce return rates by 10–20% and lift conversion by 20–40%.",
      insight:
        "ClosetAI's virtual try‑on and smart recommendations help you choose right the first time – moving from cold algorithmic feeds to technology that empowers human judgement.",
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
        "Choice fatigue is the deteriorating quality of decisions after prolonged decision‑making. AI‑driven personalization significantly reduces cognitive load and purchase postponement.",
      insight:
        "Instead of overwhelming options, you get personalized, context‑aware suggestions – intelligent shortcuts based on your actual wardrobe and preferences.",
      source: "Li & Kang, J. Retailing & Consumer Services (2025); Wang et al., IEEE (2023)",
      sourceUrl: "https://ieeexplore.ieee.org/document/10406866",
      icon: "🧠",
      color: "#9f7ef5",
    },
  ];
};
